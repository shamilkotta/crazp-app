"use server";

import { revalidatePath } from "next/cache";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import {
  agentChannels,
  agentConnections,
  agentDeploymentEvents,
  agentDeployments,
  agentScheduledTasks,
  agentSkills,
  agentSubagents,
  agentTools,
  agentWorkflowTasks,
  agents,
} from "@workspace/db/schema";
import { allocateAgentSlug, slugifyAgentName } from "@/lib/agents";
import { getDb } from "@/lib/db";
import {
  findOrganizationBySlug,
  listUserOrganizations,
} from "@/lib/organization";
import { requireSession } from "@/lib/session";

const createAgentSchema = z.object({
  teamSlug: z.string().trim().min(1, "Organization not found."),
  name: z
    .string()
    .trim()
    .min(1, "Agent name is required.")
    .max(80, "Agent name must be 80 characters or fewer."),
  instructions: z
    .string()
    .trim()
    .min(1, "Instructions are required.")
    .max(20_000, "Instructions must be 20,000 characters or fewer."),
});

const agentActionSchema = z.object({
  teamSlug: z.string().trim().min(1),
  agentId: z.string().trim().min(1),
});

const updateAgentSetupSchema = agentActionSchema.extend({
  name: z.string().trim().min(1).max(80),
  instructions: z.string().trim().min(1).max(20_000),
  model: z.string().trim().min(1).max(160),
  maxSteps: z.coerce.number().int().min(1).max(1_000),
  chatRecovery: z.boolean(),
  extensions: z.boolean(),
});

const createToolSchema = agentActionSchema.extend({
  name: z.string().trim().min(1).max(80),
  kind: z.enum(["file", "inline", "builtin", "external"]),
  description: z.string().trim().max(1_000).optional(),
  sourcePath: z.string().trim().max(300).optional(),
  configPath: z.string().trim().max(300).optional(),
});

const createSkillSchema = agentActionSchema.extend({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(1_000).optional(),
  body: z.string().trim().max(20_000).optional(),
  allowedTools: z.string().trim().max(1_000).optional(),
});

const createSubagentSchema = agentActionSchema.extend({
  displayName: z.string().trim().min(1).max(80),
  description: z.string().trim().max(1_000).optional(),
  instructions: z.string().trim().max(20_000).optional(),
  model: z.string().trim().min(1).max(160),
  maxSteps: z.coerce.number().int().min(1).max(1_000),
});

const createChannelSchema = agentActionSchema.extend({
  provider: z.enum([
    "slack",
    "whatsapp",
    "telegram",
    "discord",
    "web",
    "email",
  ]),
  displayName: z.string().trim().min(1).max(80),
  credentialLabel: z.string().trim().max(160).optional(),
  webhookUrl: z.string().trim().max(500).optional(),
});

const createConnectionSchema = agentActionSchema.extend({
  provider: z.string().trim().min(1).max(80),
  displayName: z.string().trim().min(1).max(80),
  authType: z.enum(["api_key", "oauth", "webhook", "service_account"]),
  scopes: z.string().trim().max(1_000).optional(),
  credentialLabel: z.string().trim().max(160).optional(),
});

const createScheduledTaskSchema = agentActionSchema.extend({
  name: z.string().trim().min(1).max(80),
  schedule: z.string().trim().min(1).max(120),
  prompt: z.string().trim().min(1).max(20_000),
  timezone: z.string().trim().min(1).max(80),
});

const createWorkflowTaskSchema = agentActionSchema.extend({
  name: z.string().trim().min(1).max(80),
  trigger: z.enum(["manual", "schedule", "webhook", "channel_event"]),
  steps: z.string().trim().min(1).max(20_000),
});

const resourceActionSchema = agentActionSchema.extend({
  resourceType: z.enum([
    "tool",
    "skill",
    "channel",
    "connection",
    "subagent",
    "scheduledTask",
    "workflowTask",
  ]),
  resourceId: z.string().trim().min(1),
});

export type CreateAgentInput = z.infer<typeof createAgentSchema>;

export type CreateAgentResult =
  | { ok: true; agent: { id: string; name: string; slug: string } }
  | { ok: false; error: string };

type DeploymentQueueMessage = {
  type: "agent.deploy";
  deploymentId: string;
  agentId: string;
  organizationId: string;
  versionId: string;
};

type DeploymentQueue = {
  send: (payload: DeploymentQueueMessage) => Promise<void>;
};

type DeploymentEnv = {
  AGENT_DEPLOYMENT_QUEUE?: DeploymentQueue;
};

function optionalString(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || undefined;
}

function checked(formData: FormData, key: string) {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

function parseWorkflowSteps(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((instruction, index) => ({
      title: `Step ${index + 1}`,
      instruction,
    }));
}

async function getAuthorizedAgent(teamSlug: string, agentId: string) {
  const [, organizations] = await Promise.all([
    requireSession(),
    listUserOrganizations(),
  ]);
  const organization = findOrganizationBySlug(organizations, teamSlug);
  if (!organization) {
    return null;
  }

  const db = getDb();
  const [agent] = await db
    .select({ id: agents.id, organizationId: agents.organizationId })
    .from(agents)
    .where(
      and(eq(agents.id, agentId), eq(agents.organizationId, organization.id))
    )
    .limit(1);

  return agent ? { agent, organization } : null;
}

function revalidateAgentPaths(teamSlug: string, agentId: string) {
  revalidatePath(`/${teamSlug}`, "layout");
  revalidatePath(`/${teamSlug}/agents/${agentId}`, "layout");
}

async function enqueueDeploymentJob(payload: DeploymentQueueMessage) {
  const ctx = await getCloudflareContext({ async: true });
  const queue = (ctx.env as DeploymentEnv).AGENT_DEPLOYMENT_QUEUE;
  if (!queue) {
    return false;
  }

  await queue.send(payload);
  return true;
}

export async function createAgent(
  input: CreateAgentInput
): Promise<CreateAgentResult> {
  const session = await requireSession();
  const parsed = createAgentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const { teamSlug, name, instructions } = parsed.data;

  const organizations = await listUserOrganizations();
  const organization = findOrganizationBySlug(organizations, teamSlug);
  if (!organization) {
    return { ok: false, error: "Organization not found." };
  }

  const slug = await allocateAgentSlug(organization.id, name);
  const id = crypto.randomUUID();
  const db = getDb();

  try {
    await db.insert(agents).values({
      id,
      organizationId: organization.id,
      createdByUserId: session.user.id,
      name,
      slug,
      instructions,
      status: "draft",
    });
  } catch {
    return { ok: false, error: "Could not create agent. Please try again." };
  }

  revalidatePath(`/${teamSlug}`, "layout");

  return { ok: true, agent: { id, name, slug } };
}

export async function updateAgentSetup(formData: FormData) {
  await requireSession();
  const parsed = updateAgentSetupSchema.safeParse({
    teamSlug: formData.get("teamSlug"),
    agentId: formData.get("agentId"),
    name: formData.get("name"),
    instructions: formData.get("instructions"),
    model: formData.get("model"),
    maxSteps: formData.get("maxSteps"),
    chatRecovery: checked(formData, "chatRecovery"),
    extensions: checked(formData, "extensions"),
  });
  if (!parsed.success) return;

  const authorized = await getAuthorizedAgent(
    parsed.data.teamSlug,
    parsed.data.agentId
  );
  if (!authorized) return;

  await getDb()
    .update(agents)
    .set({
      name: parsed.data.name,
      instructions: parsed.data.instructions,
      model: parsed.data.model,
      maxSteps: parsed.data.maxSteps,
      chatRecovery: parsed.data.chatRecovery,
      extensions: parsed.data.extensions,
    })
    .where(eq(agents.id, parsed.data.agentId));

  revalidateAgentPaths(parsed.data.teamSlug, parsed.data.agentId);
}

export async function archiveAgent(formData: FormData) {
  await requireSession();
  const parsed = agentActionSchema.safeParse({
    teamSlug: formData.get("teamSlug"),
    agentId: formData.get("agentId"),
  });
  if (!parsed.success) return;

  const authorized = await getAuthorizedAgent(
    parsed.data.teamSlug,
    parsed.data.agentId
  );
  if (!authorized) return;

  await getDb()
    .update(agents)
    .set({ status: "archived" })
    .where(eq(agents.id, parsed.data.agentId));

  revalidatePath(`/${parsed.data.teamSlug}`);
}

export async function pauseOrResumeAgent(formData: FormData) {
  await requireSession();
  const parsed = agentActionSchema.safeParse({
    teamSlug: formData.get("teamSlug"),
    agentId: formData.get("agentId"),
  });
  if (!parsed.success) return;

  const authorized = await getAuthorizedAgent(
    parsed.data.teamSlug,
    parsed.data.agentId
  );
  if (!authorized) return;

  const [agent] = await getDb()
    .select({ status: agents.status })
    .from(agents)
    .where(eq(agents.id, parsed.data.agentId))
    .limit(1);

  if (!agent) return;

  await getDb()
    .update(agents)
    .set({ status: agent.status === "paused" ? "active" : "paused" })
    .where(eq(agents.id, parsed.data.agentId));

  revalidateAgentPaths(parsed.data.teamSlug, parsed.data.agentId);
}

export async function createAgentTool(formData: FormData) {
  await requireSession();
  const parsed = createToolSchema.safeParse({
    teamSlug: formData.get("teamSlug"),
    agentId: formData.get("agentId"),
    name: formData.get("name"),
    kind: formData.get("kind"),
    description: optionalString(formData.get("description")),
    sourcePath: optionalString(formData.get("sourcePath")),
    configPath: optionalString(formData.get("configPath")),
  });
  if (!parsed.success) return;

  const authorized = await getAuthorizedAgent(
    parsed.data.teamSlug,
    parsed.data.agentId
  );
  if (!authorized) return;

  await getDb().insert(agentTools).values({
    id: crypto.randomUUID(),
    agentId: parsed.data.agentId,
    name: parsed.data.name,
    kind: parsed.data.kind,
    description: parsed.data.description,
    sourcePath: parsed.data.sourcePath,
    configPath: parsed.data.configPath,
  });

  revalidateAgentPaths(parsed.data.teamSlug, parsed.data.agentId);
}

export async function createAgentSkill(formData: FormData) {
  await requireSession();
  const parsed = createSkillSchema.safeParse({
    teamSlug: formData.get("teamSlug"),
    agentId: formData.get("agentId"),
    name: formData.get("name"),
    description: optionalString(formData.get("description")),
    body: optionalString(formData.get("body")),
    allowedTools: optionalString(formData.get("allowedTools")),
  });
  if (!parsed.success) return;

  const authorized = await getAuthorizedAgent(
    parsed.data.teamSlug,
    parsed.data.agentId
  );
  if (!authorized) return;

  await getDb()
    .insert(agentSkills)
    .values({
      id: crypto.randomUUID(),
      agentId: parsed.data.agentId,
      name: parsed.data.name,
      description: parsed.data.description ?? "",
      body: parsed.data.body ?? "",
      rawContent: parsed.data.body ?? "",
      allowedTools: parsed.data.allowedTools,
    });

  revalidateAgentPaths(parsed.data.teamSlug, parsed.data.agentId);
}

export async function createAgentSubagent(formData: FormData) {
  await requireSession();
  const parsed = createSubagentSchema.safeParse({
    teamSlug: formData.get("teamSlug"),
    agentId: formData.get("agentId"),
    displayName: formData.get("displayName"),
    description: optionalString(formData.get("description")),
    instructions: optionalString(formData.get("instructions")),
    model: formData.get("model"),
    maxSteps: formData.get("maxSteps"),
  });
  if (!parsed.success) return;

  const authorized = await getAuthorizedAgent(
    parsed.data.teamSlug,
    parsed.data.agentId
  );
  if (!authorized) return;

  await getDb()
    .insert(agentSubagents)
    .values({
      id: crypto.randomUUID(),
      agentId: parsed.data.agentId,
      key: slugifyAgentName(parsed.data.displayName),
      displayName: parsed.data.displayName,
      description: parsed.data.description ?? "",
      instructions: parsed.data.instructions ?? "",
      model: parsed.data.model,
      maxSteps: parsed.data.maxSteps,
    });

  revalidateAgentPaths(parsed.data.teamSlug, parsed.data.agentId);
}

export async function createAgentChannel(formData: FormData) {
  await requireSession();
  const parsed = createChannelSchema.safeParse({
    teamSlug: formData.get("teamSlug"),
    agentId: formData.get("agentId"),
    provider: formData.get("provider"),
    displayName: formData.get("displayName"),
    credentialLabel: optionalString(formData.get("credentialLabel")),
    webhookUrl: optionalString(formData.get("webhookUrl")),
  });
  if (!parsed.success) return;

  const authorized = await getAuthorizedAgent(
    parsed.data.teamSlug,
    parsed.data.agentId
  );
  if (!authorized) return;

  await getDb()
    .insert(agentChannels)
    .values({
      id: crypto.randomUUID(),
      agentId: parsed.data.agentId,
      provider: parsed.data.provider,
      displayName: parsed.data.displayName,
      configJson: {
        credentialLabel: parsed.data.credentialLabel,
        webhookUrl: parsed.data.webhookUrl,
      },
    });

  revalidateAgentPaths(parsed.data.teamSlug, parsed.data.agentId);
}

export async function createAgentConnection(formData: FormData) {
  await requireSession();
  const parsed = createConnectionSchema.safeParse({
    teamSlug: formData.get("teamSlug"),
    agentId: formData.get("agentId"),
    provider: formData.get("provider"),
    displayName: formData.get("displayName"),
    authType: formData.get("authType"),
    scopes: optionalString(formData.get("scopes")),
    credentialLabel: optionalString(formData.get("credentialLabel")),
  });
  if (!parsed.success) return;

  const authorized = await getAuthorizedAgent(
    parsed.data.teamSlug,
    parsed.data.agentId
  );
  if (!authorized) return;

  await getDb()
    .insert(agentConnections)
    .values({
      id: crypto.randomUUID(),
      agentId: parsed.data.agentId,
      provider: parsed.data.provider,
      displayName: parsed.data.displayName,
      authType: parsed.data.authType,
      scopes: parsed.data.scopes,
      configJson: {
        credentialLabel: parsed.data.credentialLabel,
      },
    });

  revalidateAgentPaths(parsed.data.teamSlug, parsed.data.agentId);
}

export async function createAgentScheduledTask(formData: FormData) {
  await requireSession();
  const parsed = createScheduledTaskSchema.safeParse({
    teamSlug: formData.get("teamSlug"),
    agentId: formData.get("agentId"),
    name: formData.get("name"),
    schedule: formData.get("schedule"),
    prompt: formData.get("prompt"),
    timezone: formData.get("timezone"),
  });
  if (!parsed.success) return;

  const authorized = await getAuthorizedAgent(
    parsed.data.teamSlug,
    parsed.data.agentId
  );
  if (!authorized) return;

  await getDb().insert(agentScheduledTasks).values({
    id: crypto.randomUUID(),
    agentId: parsed.data.agentId,
    name: parsed.data.name,
    schedule: parsed.data.schedule,
    prompt: parsed.data.prompt,
    timezone: parsed.data.timezone,
  });

  revalidateAgentPaths(parsed.data.teamSlug, parsed.data.agentId);
}

export async function createAgentWorkflowTask(formData: FormData) {
  await requireSession();
  const parsed = createWorkflowTaskSchema.safeParse({
    teamSlug: formData.get("teamSlug"),
    agentId: formData.get("agentId"),
    name: formData.get("name"),
    trigger: formData.get("trigger"),
    steps: formData.get("steps"),
  });
  if (!parsed.success) return;

  const authorized = await getAuthorizedAgent(
    parsed.data.teamSlug,
    parsed.data.agentId
  );
  if (!authorized) return;

  await getDb()
    .insert(agentWorkflowTasks)
    .values({
      id: crypto.randomUUID(),
      agentId: parsed.data.agentId,
      name: parsed.data.name,
      trigger: parsed.data.trigger,
      stepsJson: parseWorkflowSteps(parsed.data.steps),
    });

  revalidateAgentPaths(parsed.data.teamSlug, parsed.data.agentId);
}

export async function toggleAgentResource(formData: FormData) {
  await requireSession();
  const parsed = resourceActionSchema.safeParse({
    teamSlug: formData.get("teamSlug"),
    agentId: formData.get("agentId"),
    resourceType: formData.get("resourceType"),
    resourceId: formData.get("resourceId"),
  });
  if (!parsed.success) return;

  const authorized = await getAuthorizedAgent(
    parsed.data.teamSlug,
    parsed.data.agentId
  );
  if (!authorized) return;

  const db = getDb();
  const { resourceId, resourceType, agentId } = parsed.data;

  if (resourceType === "tool") {
    const [row] = await db
      .select({ enabled: agentTools.enabled })
      .from(agentTools)
      .where(
        and(eq(agentTools.id, resourceId), eq(agentTools.agentId, agentId))
      )
      .limit(1);
    if (row) {
      await db
        .update(agentTools)
        .set({ enabled: !row.enabled })
        .where(eq(agentTools.id, resourceId));
    }
  } else if (resourceType === "skill") {
    const [row] = await db
      .select({ enabled: agentSkills.enabled })
      .from(agentSkills)
      .where(
        and(eq(agentSkills.id, resourceId), eq(agentSkills.agentId, agentId))
      )
      .limit(1);
    if (row) {
      await db
        .update(agentSkills)
        .set({ enabled: !row.enabled })
        .where(eq(agentSkills.id, resourceId));
    }
  } else if (resourceType === "channel") {
    const [row] = await db
      .select({ enabled: agentChannels.enabled })
      .from(agentChannels)
      .where(
        and(
          eq(agentChannels.id, resourceId),
          eq(agentChannels.agentId, agentId)
        )
      )
      .limit(1);
    if (row) {
      await db
        .update(agentChannels)
        .set({ enabled: !row.enabled })
        .where(eq(agentChannels.id, resourceId));
    }
  } else if (resourceType === "connection") {
    const [row] = await db
      .select({ enabled: agentConnections.enabled })
      .from(agentConnections)
      .where(
        and(
          eq(agentConnections.id, resourceId),
          eq(agentConnections.agentId, agentId)
        )
      )
      .limit(1);
    if (row) {
      await db
        .update(agentConnections)
        .set({ enabled: !row.enabled })
        .where(eq(agentConnections.id, resourceId));
    }
  } else if (resourceType === "subagent") {
    const [row] = await db
      .select({ enabled: agentSubagents.enabled })
      .from(agentSubagents)
      .where(
        and(
          eq(agentSubagents.id, resourceId),
          eq(agentSubagents.agentId, agentId)
        )
      )
      .limit(1);
    if (row) {
      await db
        .update(agentSubagents)
        .set({ enabled: !row.enabled })
        .where(eq(agentSubagents.id, resourceId));
    }
  } else if (resourceType === "scheduledTask") {
    const [row] = await db
      .select({ enabled: agentScheduledTasks.enabled })
      .from(agentScheduledTasks)
      .where(
        and(
          eq(agentScheduledTasks.id, resourceId),
          eq(agentScheduledTasks.agentId, agentId)
        )
      )
      .limit(1);
    if (row) {
      await db
        .update(agentScheduledTasks)
        .set({ enabled: !row.enabled })
        .where(eq(agentScheduledTasks.id, resourceId));
    }
  } else {
    const [row] = await db
      .select({ enabled: agentWorkflowTasks.enabled })
      .from(agentWorkflowTasks)
      .where(
        and(
          eq(agentWorkflowTasks.id, resourceId),
          eq(agentWorkflowTasks.agentId, agentId)
        )
      )
      .limit(1);
    if (row) {
      await db
        .update(agentWorkflowTasks)
        .set({ enabled: !row.enabled })
        .where(eq(agentWorkflowTasks.id, resourceId));
    }
  }

  revalidateAgentPaths(parsed.data.teamSlug, parsed.data.agentId);
}

export async function deleteAgentResource(formData: FormData) {
  await requireSession();
  const parsed = resourceActionSchema.safeParse({
    teamSlug: formData.get("teamSlug"),
    agentId: formData.get("agentId"),
    resourceType: formData.get("resourceType"),
    resourceId: formData.get("resourceId"),
  });
  if (!parsed.success) return;

  const authorized = await getAuthorizedAgent(
    parsed.data.teamSlug,
    parsed.data.agentId
  );
  if (!authorized) return;

  const db = getDb();
  const { resourceId, resourceType, agentId } = parsed.data;

  if (resourceType === "tool") {
    await db
      .delete(agentTools)
      .where(
        and(eq(agentTools.id, resourceId), eq(agentTools.agentId, agentId))
      );
  } else if (resourceType === "skill") {
    await db
      .delete(agentSkills)
      .where(
        and(eq(agentSkills.id, resourceId), eq(agentSkills.agentId, agentId))
      );
  } else if (resourceType === "channel") {
    await db
      .delete(agentChannels)
      .where(
        and(
          eq(agentChannels.id, resourceId),
          eq(agentChannels.agentId, agentId)
        )
      );
  } else if (resourceType === "connection") {
    await db
      .delete(agentConnections)
      .where(
        and(
          eq(agentConnections.id, resourceId),
          eq(agentConnections.agentId, agentId)
        )
      );
  } else if (resourceType === "subagent") {
    await db
      .delete(agentSubagents)
      .where(
        and(
          eq(agentSubagents.id, resourceId),
          eq(agentSubagents.agentId, agentId)
        )
      );
  } else if (resourceType === "scheduledTask") {
    await db
      .delete(agentScheduledTasks)
      .where(
        and(
          eq(agentScheduledTasks.id, resourceId),
          eq(agentScheduledTasks.agentId, agentId)
        )
      );
  } else {
    await db
      .delete(agentWorkflowTasks)
      .where(
        and(
          eq(agentWorkflowTasks.id, resourceId),
          eq(agentWorkflowTasks.agentId, agentId)
        )
      );
  }

  revalidateAgentPaths(parsed.data.teamSlug, parsed.data.agentId);
}

export async function deployAgent(formData: FormData) {
  await requireSession();
  const teamSlug = String(formData.get("teamSlug") ?? "");
  const agentId = String(formData.get("agentId") ?? "");

  if (!teamSlug || !agentId) {
    return;
  }

  const organizations = await listUserOrganizations();
  const organization = findOrganizationBySlug(organizations, teamSlug);
  if (!organization) {
    return;
  }

  const db = getDb();
  const deploymentId = crypto.randomUUID();
  const versionId = deploymentId;
  const workerNamePrefix = `crazp-${teamSlug}-`
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-");

  const [agent] = await db
    .update(agents)
    .set({
      status: "deploying",
      latestDeploymentId: deploymentId,
      workerName: sql<string>`substr(${workerNamePrefix} || ${agents.slug}, 1, 63)`,
    })
    .where(
      and(eq(agents.id, agentId), eq(agents.organizationId, organization.id))
    )
    .returning({
      id: agents.id,
      workerName: agents.workerName,
    });

  if (!agent?.workerName) {
    return;
  }

  await db.insert(agentDeployments).values({
    id: deploymentId,
    agentId: agent.id,
    status: "queued",
    workerName: agent.workerName,
    trigger: "deploy",
    startedAt: new Date(),
  });

  await db.insert(agentDeploymentEvents).values({
    id: crypto.randomUUID(),
    deploymentId,
    level: "info",
    phase: "queue",
    message: "Deployment created and ready to queue.",
    metadataJson: {
      versionId,
    },
  });

  try {
    const queued = await enqueueDeploymentJob({
      type: "agent.deploy",
      deploymentId,
      agentId: agent.id,
      organizationId: organization.id,
      versionId,
    });

    await db.insert(agentDeploymentEvents).values({
      id: crypto.randomUUID(),
      deploymentId,
      level: queued ? "info" : "warn",
      phase: "queue",
      message: queued
        ? "Deployment job queued."
        : "Deployment queue binding is not configured yet.",
      metadataJson: { versionId },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Could not queue deployment job.";

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
      .set({
        status: "error",
      })
      .where(eq(agents.id, agent.id));

    await db.insert(agentDeploymentEvents).values({
      id: crypto.randomUUID(),
      deploymentId,
      level: "error",
      phase: "queue",
      message,
      metadataJson: { versionId },
    });
  }

  revalidateAgentPaths(teamSlug, agent.id);
}
