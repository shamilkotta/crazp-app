import { createDb } from "@workspace/db";
import { AwsClient } from "aws4fetch";
import {
  deploymentEvents as agentDeploymentEvents,
  deployments as agentDeployments,
  dependencies as agentDependencies,
  skills as agentSkills,
  agents,
  type AgentDeploymentManifest,
} from "@workspace/db/schema";
import { and, eq } from "drizzle-orm";
import { buildWithCrazp } from "./build";
import { prewarmSandbox, ContainerProxy, Sandbox } from "./sandbox";
import { resolveDispatchWorker, resolveR2S3Credentials } from "./config";
import { deployCrazp } from "./deploy";

export { ContainerProxy, Sandbox };

type FrameworkFile = {
  path: string;
  content: string;
};

type SkillResourceFile = {
  path: string;
  ref: string;
  key: string;
};

type AgentDeploymentFrameworkFile = FrameworkFile | SkillResourceFile;

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
  dependencies: AgentDeploymentDependency[];
};

type AgentDeploymentDependency = {
  name: string;
  version: string;
  kind: "dependency" | "devDependency";
};

type SkillResource = {
  path: string;
  kind: "reference" | "script" | "asset" | "file";
  mimeType: string | null;
  key: string;
};

type AgentDeploymentSkill = {
  id: string;
  name: string;
  rawContent: string;
  resources: SkillResource[];
};

type AgentDeploymentFramework = {
  manifest: AgentDeploymentManifest;
  files: AgentDeploymentFrameworkFile[];
};

function createAgentDeploymentManifest(input: {
  agent: AgentDeploymentSource;
  skills: AgentDeploymentSkill[];
}): AgentDeploymentManifest {
  const { agent } = input;
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
    skills: input.skills.map((skill) => ({
      id: skill.id,
      name: skill.name,
      resources: skill.resources.map((resource) => ({
        path: resource.path,
      })),
    })),
    dependencies: agent.dependencies,
  };
}

function packageJsonFromDependencies(
  dependencies: AgentDeploymentDependency[]
) {
  const packageDependencies: Record<string, string> = {};
  const packageDevDependencies: Record<string, string> = {};

  for (const dependency of dependencies) {
    if (dependency.kind === "devDependency") {
      packageDevDependencies[dependency.name] = dependency.version;
    } else {
      packageDependencies[dependency.name] = dependency.version;
    }
  }

  return {
    dependencies: {
      ...packageDependencies,
      "@crazp/core": "file:/workspace/vendor/crazp",
      crazp: "^0.0.1",
    },
    devDependencies: packageDevDependencies,
  };
}

// TODO: subagents, tools, channels ...etc
function createAgentDeploymentFramework(input: {
  agent: AgentDeploymentSource;
  skills: AgentDeploymentSkill[];
  r2Keys: ReturnType<typeof createDeploymentR2Keys>;
}): AgentDeploymentFramework {
  const { agent } = input;
  const manifest = createAgentDeploymentManifest(input);
  const packageJson = packageJsonFromDependencies(agent.dependencies);
  const skillFiles: AgentDeploymentFrameworkFile[] = [];
  for (const skill of input.skills) {
    const skillDir = `agent/skills/${sanitizePathSegment(skill.name)}`;
    skillFiles.push({
      path: `${skillDir}/SKILL.md`,
      content: skill.rawContent,
    });

    for (const resource of skill.resources) {
      const resourcePath = `${skillDir}/${normalizeFrameworkPath(resource.path)}`;
      skillFiles.push({
        path: resourcePath,
        ref: resource.key,
        key: `${input.r2Keys.sourceSkillResourcesPrefix}/${skill.id}/${normalizeFrameworkPath(resource.path)}`,
      });
    }
  }

  return {
    manifest,
    files: [
      {
        path: "agent/agent.ts",
        content: `import { defineAgent } from "crazp";

export default defineAgent({
  name: ${JSON.stringify(agent.slug)},
  slug: ${JSON.stringify(agent.slug)},
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
      {
        path: "package.json",
        content: JSON.stringify(
          {
            name: agent.slug,
            type: "module",
            ...packageJson,
          },
          null,
          2
        ),
      },
      ...skillFiles,
    ],
  };
}

function sanitizePathSegment(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function normalizeFrameworkPath(path: string) {
  const normalized = path.replace(/\\/g, "/").replace(/^\/+/, "");
  if (normalized.split("/").some((part) => part === "..")) {
    throw new Error(`Invalid framework file path: ${path}`);
  }
  return normalized;
}

function createDeploymentR2Keys(
  organizationId: string,
  agentId: string,
  versionId: string
) {
  const prefix = `organizations/${organizationId}/agents/${agentId}/deployments/${versionId}`;
  const sourcePrefix = `${prefix}/source`;
  const outputPrefix = `${prefix}/output`;
  return {
    prefix,
    sourcePrefix,
    outputPrefix,
    source: `${sourcePrefix}/source.json`,
    build: `${outputPrefix}/output.json`,
    snapshotManifest: `${sourcePrefix}/agent-snapshot.json`,
    sourceSkillResourcesPrefix: `${sourcePrefix}/skills`,
    buildArtifact: `${outputPrefix}/output.tar.gz`,
  };
}

function encodeS3Key(key: string) {
  return key
    .split("/")
    .filter((segment) => segment.length > 0)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

async function copyObjectInR2(
  env: CloudflareEnv,
  sourceKey: string,
  destinationKey: string
) {
  const { accessKeyId, secretAccessKey, bucketName } =
    resolveR2S3Credentials(env);
  const client = new AwsClient({
    accessKeyId,
    secretAccessKey,
    service: "s3",
    region: "auto",
  });
  const endpoint = `https://${env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const url = `${endpoint}/${bucketName}/${encodeS3Key(destinationKey)}`;
  const copySource = `/${bucketName}/${encodeS3Key(sourceKey)}`;

  const response = await client.fetch(url, {
    method: "PUT",
    headers: {
      "x-amz-copy-source": copySource,
    },
  });

  const detail = await response.text();
  if (!response.ok) {
    throw new Error(`R2 CopyObject failed (${response.status}): ${detail}`);
  }
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
  console.error("Failing deployment:", {
    deploymentId,
    agentId,
    phase,
    message,
  });
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

async function handleDeploymentJob(
  env: CloudflareEnv,
  job: DeploymentQueueMessage
) {
  if (job.type !== "agent.deploy") {
    return;
  }

  const prewarm = prewarmSandbox(env, job.deploymentId);

  const db = createDb(env.DATABASE);
  let currentPhase = "initializing";

  try {
    const agent = await db.query.agents.findFirst({
      columns: {
        id: true,
        name: true,
        slug: true,
        instructions: true,
        model: true,
        maxSteps: true,
        chatRecovery: true,
        extensions: true,
        executionConfigJson: true,
      },
      where: eq(agents.id, job.agentId),
      with: {
        dependencies: {
          where: eq(agentDependencies.enabled, true),
          columns: {
            name: true,
            version: true,
            kind: true,
          },
        },
        deployments: {
          where: eq(agentDeployments.id, job.deploymentId),
          columns: {
            id: true,
            agentId: true,
            workerName: true,
          },
        },
      },
    });

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

    const deployment = agent.deployments[0];

    if (!deployment) {
      throw new Error("Deployment not found.");
    }

    const skills = await db.query.skills.findMany({
      columns: {
        id: true,
        name: true,
        rawContent: true,
      },
      with: {
        resources: {
          columns: {
            path: true,
            kind: true,
            mimeType: true,
            key: true,
          },
        },
      },
      where: and(
        eq(agentSkills.agentId, job.agentId),
        eq(agentSkills.enabled, true)
      ),
    });

    currentPhase = "scaffolding";

    const r2Keys = createDeploymentR2Keys(
      job.organizationId,
      job.agentId,
      job.versionId
    );

    const framework = createAgentDeploymentFramework({
      agent,
      skills,
      r2Keys,
    });

    await recordEvent(db, job.deploymentId, {
      phase: currentPhase,
      message: "Creating filesystem framework.",
      metadataJson: {
        files: framework.files.map((file) => file.path),
        r2Prefix: r2Keys.prefix,
      },
    });

    currentPhase = "r2-storage";
    // copy skill resources from reference to deployment source
    let copyObjectPromises: Promise<void>[] = [];
    for (const file of framework.files) {
      if ("ref" in file && "key" in file) {
        copyObjectPromises.push(copyObjectInR2(env, file.ref, file.key));
      }
    }

    await Promise.all([
      env.AGENT_DEPLOYMENT_BUCKET.put(
        r2Keys.source,
        JSON.stringify({ version: 1, files: framework.files }, null, 2),
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
      ...copyObjectPromises,
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

    await prewarm;
    const buildOutput = await buildWithCrazp(
      env,
      job.deploymentId,
      r2Keys.sourcePrefix,
      r2Keys.outputPrefix
    );

    currentPhase = "r2-storage";

    await recordEvent(db, job.deploymentId, {
      phase: currentPhase,
      message: "Build output written to R2.",
      metadataJson: {
        buildR2Key: r2Keys.build,
        buildArtifactR2Key: r2Keys.buildArtifact,
        versionId: job.versionId,
      },
    });

    const { namespace: dispatchNamespace, workerUrl } = resolveDispatchWorker(
      env,
      deployment.workerName
    );

    await recordEvent(db, job.deploymentId, {
      phase: "deploying",
      message: "Deploying build output to Workers for Platforms.",
      metadataJson: {
        dispatchNamespace,
        workerName: deployment.workerName,
      },
    });

    currentPhase = "deploying";

    await db
      .update(agentDeployments)
      .set({
        status: "deploying",
        buildR2Key: r2Keys.build,
        buildR2VersionId: job.versionId,
        buildOutputPath: r2Keys.buildArtifact,
        wranglerConfigJson: buildOutput.wranglerConfig,
      })
      .where(eq(agentDeployments.id, job.deploymentId));

    const deployResult = await deployCrazp(env, {
      deploymentId: job.deploymentId,
      workerName: deployment.workerName,
      dispatchNamespace,
    });

    await db
      .update(agentDeployments)
      .set({
        status: "active",
        workerUrl,
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
      metadataJson: {
        workerUrl,
        dispatchNamespace,
        deployStdout: deployResult.stdout.slice(-4000),
      },
    });
  } catch (error) {
    console.log({ error });
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
  async queue(batch: MessageBatch<DeploymentQueueMessage>, env: CloudflareEnv) {
    for (const message of batch.messages) {
      try {
        await handleDeploymentJob(env, message.body);
        message.ack();
      } catch (error) {
        console.error("Failed to handle deployment job:", {
          error,
          message: message.body,
        });
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
        message.ack();
      }
    }
  },
};
