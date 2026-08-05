import { createDb } from "@workspace/db";
import {
  agentDeploymentEvents,
  agentDeployments,
  agents,
  type AgentDeploymentManifest,
} from "@workspace/db/schema";
import { eq } from "drizzle-orm";

type Env = {
  DATABASE: D1Database;
  AGENT_DEPLOYMENT_BUCKET: R2Bucket;
  CLOUDFLARE_ACCOUNT_ID: string;
  CLOUDFLARE_API_TOKEN: string;
  CLOUDFLARE_API_BASE_URL?: string;
  CLOUDFLARE_WORKERS_SUBDOMAIN?: string;
};

type SerializedBuildOutputFile = {
  path: string;
  content: string;
  contentEncoding: "text" | "base64";
  contentType?: string;
};

type DeploymentQueueMessage = {
  type: "agent.deploy";
  deploymentId: string;
  agentId: string;
  organizationId: string;
  versionId: string;
};

type AgentDeploymentSource = {
  id: string;
  name: string;
  slug: string;
  instructions: string;
  model: string;
  maxSteps: number;
  chatRecovery: boolean;
  extensions: boolean;
  executionConfigJson: Record<string, unknown>;
};

type AgentDeploymentFrameworkFile = {
  path: string;
  content: string;
};

type AgentDeploymentFramework = {
  manifest: AgentDeploymentManifest;
  files: AgentDeploymentFrameworkFile[];
};

type BuildOutputFile = {
  path: string;
  content: string;
  contentType?: string;
};

type CrazpBuildOutput = {
  files: BuildOutputFile[];
  workerScript: string;
  wranglerConfig?: Record<string, unknown>;
};

type CrazpBuildModule = {
  buildFilesystemAgent?: (input: {
    files: AgentDeploymentFrameworkFile[];
  }) => Promise<CrazpBuildOutput>;
};

function createAgentDeploymentManifest(
  agent: AgentDeploymentSource
): AgentDeploymentManifest {
  return {
    agent: {
      id: agent.id,
      name: agent.name,
      slug: agent.slug,
      instructions: agent.instructions,
      model: agent.model,
      maxSteps: agent.maxSteps,
      chatRecovery: agent.chatRecovery,
      extensions: agent.extensions,
      executionConfigJson: agent.executionConfigJson,
    },
  };
}

function createAgentDeploymentFramework(
  agent: AgentDeploymentSource
): AgentDeploymentFramework {
  const manifest = createAgentDeploymentManifest(agent);

  return {
    manifest,
    files: [
      {
        path: "agent/agent.ts",
        content: `import { defineAgent } from "crazp";

export default defineAgent({
  name: ${JSON.stringify(agent.name)},
  model: ${JSON.stringify(agent.model)},
  maxSteps: ${agent.maxSteps},
  chatRecovery: ${JSON.stringify(agent.chatRecovery)},
  extensions: ${JSON.stringify(agent.extensions)}
});
`,
      },
      {
        path: "agent/instructions.md",
        content: `${agent.instructions.trim()}\n`,
      },
      {
        path: ".crazp/agent-snapshot.json",
        content: `${JSON.stringify(manifest, null, 2)}\n`,
      },
    ],
  };
}

function createDeploymentR2Keys(
  organizationId: string,
  agentId: string,
  versionId: string
) {
  const prefix = `organizations/${organizationId}/agents/${agentId}/deployments/${versionId}`;
  return {
    prefix,
    source: `${prefix}/source.json`,
    build: `${prefix}/build-output.json`,
    snapshotManifest: `${prefix}/agent-snapshot.json`,
  };
}

function serializeSourceBundle(files: AgentDeploymentFrameworkFile[]) {
  return JSON.stringify({ version: 1, files }, null, 2);
}

async function buildWithCrazp(
  files: AgentDeploymentFrameworkFile[]
): Promise<CrazpBuildOutput> {
  const buildModule = "crazp/build";
  const module = (await import(buildModule)) as CrazpBuildModule;
  if (!module.buildFilesystemAgent) {
    throw new Error("crazp/build must export buildFilesystemAgent().");
  }

  return module.buildFilesystemAgent({ files });
}

async function recordEvent(
  db: ReturnType<typeof createDb>,
  deploymentId: string,
  input: {
    level?: "info" | "warn" | "error";
    phase: string;
    message: string;
    metadataJson?: Record<string, unknown>;
  }
) {
  await db.insert(agentDeploymentEvents).values({
    id: crypto.randomUUID(),
    deploymentId,
    level: input.level ?? "info",
    phase: input.phase,
    message: input.message,
    metadataJson: input.metadataJson,
  });
}

async function failDeployment(
  db: ReturnType<typeof createDb>,
  deploymentId: string,
  agentId: string,
  phase: string,
  message: string
) {
  await db
    .update(agentDeployments)
    .set({
      status: "error",
      errorMessage: message,
      finishedAt: new Date(),
    })
    .where(eq(agentDeployments.id, deploymentId));

  await db
    .update(agents)
    .set({ status: "error" })
    .where(eq(agents.id, agentId));

  await recordEvent(db, deploymentId, {
    level: "error",
    phase,
    message,
  });
}

function serializeBuildOutput(output: CrazpBuildOutput) {
  const files: SerializedBuildOutputFile[] = output.files.map(
    (file: BuildOutputFile) => {
      return {
        path: file.path,
        content: file.content,
        contentEncoding: "text",
        contentType: file.contentType,
      };
    }
  );

  return JSON.stringify(
    {
      version: 1,
      files,
      wranglerConfig: output.wranglerConfig ?? null,
    },
    null,
    2
  );
}

async function deployWorkerScript(
  env: Env,
  workerName: string,
  workerScript: string
) {
  const baseUrl =
    env.CLOUDFLARE_API_BASE_URL ?? "https://api.cloudflare.com/client/v4";
  const response = await fetch(
    `${baseUrl}/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/workers/scripts/${workerName}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
        "Content-Type": "application/javascript+module",
      },
      body: workerScript,
    }
  );

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Cloudflare worker deploy failed: ${detail}`);
  }
}

function getWorkerUrl(env: Env, workerName: string) {
  if (!env.CLOUDFLARE_WORKERS_SUBDOMAIN) {
    return undefined;
  }

  return `https://${workerName}.${env.CLOUDFLARE_WORKERS_SUBDOMAIN}.workers.dev`;
}

async function handleDeploymentJob(env: Env, job: DeploymentQueueMessage) {
  if (job.type !== "agent.deploy") {
    return;
  }

  const db = createDb(env.DATABASE);
  let currentPhase = "initializing";

  try {
    const [agent] = await db
      .select({
        id: agents.id,
        name: agents.name,
        slug: agents.slug,
        instructions: agents.instructions,
        model: agents.model,
        maxSteps: agents.maxSteps,
        chatRecovery: agents.chatRecovery,
        extensions: agents.extensions,
        executionConfigJson: agents.executionConfigJson,
      })
      .from(agents)
      .where(eq(agents.id, job.agentId))
      .limit(1);

    if (!agent) {
      await failDeployment(
        db,
        job.deploymentId,
        job.agentId,
        currentPhase,
        "Agent not found while creating deployment framework."
      );
      return;
    }

    const [deployment] = await db
      .select({
        id: agentDeployments.id,
        agentId: agentDeployments.agentId,
        workerName: agentDeployments.workerName,
      })
      .from(agentDeployments)
      .where(eq(agentDeployments.id, job.deploymentId))
      .limit(1);

    if (!deployment) {
      throw new Error("Deployment not found.");
    }

    currentPhase = "scaffolding";
    const framework = createAgentDeploymentFramework(agent);
    const r2Keys = createDeploymentR2Keys(
      job.organizationId,
      job.agentId,
      job.versionId
    );

    await recordEvent(db, job.deploymentId, {
      phase: currentPhase,
      message: "Creating filesystem framework.",
      metadataJson: {
        files: framework.files.map((file) => file.path),
        r2Prefix: r2Keys.prefix,
      },
    });

    currentPhase = "r2-storage";
    await Promise.all([
      env.AGENT_DEPLOYMENT_BUCKET.put(
        r2Keys.source,
        serializeSourceBundle(framework.files),
        {
          customMetadata: {
            deploymentId: job.deploymentId,
            versionId: job.versionId,
            kind: "source",
          },
          httpMetadata: { contentType: "application/json" },
        }
      ),
      env.AGENT_DEPLOYMENT_BUCKET.put(
        r2Keys.snapshotManifest,
        JSON.stringify(framework.manifest, null, 2),
        {
          customMetadata: {
            deploymentId: job.deploymentId,
            versionId: job.versionId,
            kind: "snapshot",
          },
          httpMetadata: { contentType: "application/json" },
        }
      ),
    ]);

    await recordEvent(db, job.deploymentId, {
      phase: currentPhase,
      message: "Filesystem framework saved to R2.",
      metadataJson: {
        sourceR2Key: r2Keys.source,
        snapshotManifestR2Key: r2Keys.snapshotManifest,
        versionId: job.versionId,
      },
    });

    currentPhase = "building";
    await db
      .update(agentDeployments)
      .set({
        status: "building",
        manifestJson: framework.manifest,
        sourceR2Key: r2Keys.source,
        sourceR2VersionId: job.versionId,
        snapshotManifestR2Key: r2Keys.snapshotManifest,
        snapshotManifestR2VersionId: job.versionId,
      })
      .where(eq(agentDeployments.id, job.deploymentId));

    await recordEvent(db, job.deploymentId, {
      phase: currentPhase,
      message: "Building worker script from filesystem framework.",
    });

    const buildOutput = await buildWithCrazp(framework.files);

    currentPhase = "r2-storage";
    await env.AGENT_DEPLOYMENT_BUCKET.put(
      r2Keys.build,
      serializeBuildOutput(buildOutput),
      {
        customMetadata: {
          deploymentId: job.deploymentId,
          versionId: job.versionId,
          kind: "build",
        },
        httpMetadata: { contentType: "application/json" },
      }
    );

    await recordEvent(db, job.deploymentId, {
      phase: currentPhase,
      message: "Build output saved to R2.",
      metadataJson: { buildR2Key: r2Keys.build, versionId: job.versionId },
    });

    await recordEvent(db, job.deploymentId, {
      phase: "deploying",
      message: "Deploying build output to Cloudflare Workers.",
    });

    currentPhase = "deploying";

    await db
      .update(agentDeployments)
      .set({
        status: "deploying",
        buildR2Key: r2Keys.build,
        buildR2VersionId: job.versionId,
        buildOutputPath: r2Keys.build,
        wranglerConfigJson: buildOutput.wranglerConfig,
      })
      .where(eq(agentDeployments.id, job.deploymentId));

    await deployWorkerScript(
      env,
      deployment.workerName,
      buildOutput.workerScript
    );

    const workerUrl = getWorkerUrl(env, deployment.workerName);

    await db
      .update(agentDeployments)
      .set({
        status: "active",
        workerUrl,
        cloudflareAccountId: env.CLOUDFLARE_ACCOUNT_ID,
        finishedAt: new Date(),
      })
      .where(eq(agentDeployments.id, job.deploymentId));

    await db
      .update(agents)
      .set({
        status: "active",
        deploymentUrl: workerUrl,
        latestDeploymentId: job.deploymentId,
      })
      .where(eq(agents.id, job.agentId));

    await recordEvent(db, job.deploymentId, {
      phase: "active",
      message: "Deployment is active.",
      metadataJson: { workerUrl },
    });
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "Deployment job failed.";
    await failDeployment(
      db,
      job.deploymentId,
      job.agentId,
      currentPhase,
      detail
    );
  }
}

export default {
  async queue(batch: MessageBatch<DeploymentQueueMessage>, env: Env) {
    for (const message of batch.messages) {
      try {
        await handleDeploymentJob(env, message.body);
      } catch (error) {
        const body = message.body;
        const db = createDb(env.DATABASE);
        const detail =
          error instanceof Error ? error.message : "Deployment job failed.";
        await failDeployment(
          db,
          body.deploymentId,
          body.agentId,
          "deployment",
          detail
        );
      }
    }
  },
};
