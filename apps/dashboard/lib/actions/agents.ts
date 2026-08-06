"use server";

import { revalidatePath } from "next/cache";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import {
  agentDeploymentEvents,
  agentDeployments,
  agents,
} from "@workspace/db/schema";
import { allocateAgentSlug } from "@/lib/agents";
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
  const parsed = createAgentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const { teamSlug, name, instructions } = parsed.data;

  const [session, organizations] = await Promise.all([
    requireSession(),
    listUserOrganizations(),
  ]);

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

  revalidatePath(`/${teamSlug}`);
  revalidatePath(`/${teamSlug}/agents`);

  return { ok: true, agent: { id, name, slug } };
}

export async function deployAgent(formData: FormData) {
  const teamSlug = String(formData.get("teamSlug") ?? "");
  const agentId = String(formData.get("agentId") ?? "");

  if (!teamSlug || !agentId) {
    return;
  }

  const [, organizations] = await Promise.all([
    requireSession(),
    listUserOrganizations(),
  ]);
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

  revalidatePath(`/${teamSlug}`);
  revalidatePath(`/${teamSlug}/agents/${agent.id}`);
}
