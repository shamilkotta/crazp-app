import { and, desc, eq, ne } from "drizzle-orm";
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
  type Agent,
  type AgentChannel,
  type AgentConnection,
  type AgentDeployment,
  type AgentDeploymentEvent,
  type AgentScheduledTask,
  type AgentSkill,
  type AgentSubagent,
  type AgentTool,
  type AgentWorkflowTask,
} from "@workspace/db/schema";
import { getDb } from "@/lib/db";

export type AgentListItem = {
  id: string;
  name: string;
  slug: string;
  instructions: string;
  model: string;
  maxSteps: number;
  chatRecovery: boolean;
  extensions: boolean;
  deploymentUrl: string | null;
  status: Agent["status"];
  lastRunAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  resourceCounts: {
    tools: number;
    skills: number;
    channels: number;
    connections: number;
    subagents: number;
    scheduledTasks: number;
    workflowTasks: number;
  };
};

export type AgentDetailData = AgentListItem & {
  tools: AgentTool[];
  skills: AgentSkill[];
  channels: AgentChannel[];
  connections: AgentConnection[];
  subagents: AgentSubagent[];
  scheduledTasks: AgentScheduledTask[];
  workflowTasks: AgentWorkflowTask[];
  deployments: AgentDeployment[];
  deploymentEvents: AgentDeploymentEvent[];
};

export function slugifyAgentName(name: string) {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return slug || "agent";
}

const agentListColumns = {
  id: agents.id,
  name: agents.name,
  slug: agents.slug,
  instructions: agents.instructions,
  model: agents.model,
  maxSteps: agents.maxSteps,
  chatRecovery: agents.chatRecovery,
  extensions: agents.extensions,
  deploymentUrl: agents.deploymentUrl,
  status: agents.status,
  lastRunAt: agents.lastRunAt,
  createdAt: agents.createdAt,
  updatedAt: agents.updatedAt,
} as const;

function countByAgentId(rows: Array<{ agentId: string }>) {
  const counts = new Map<string, number>();
  for (const row of rows) {
    counts.set(row.agentId, (counts.get(row.agentId) ?? 0) + 1);
  }
  return counts;
}

export async function listOrganizationAgents(
  organizationId: string
): Promise<AgentListItem[]> {
  const db = getDb();

  const agentRows = await db
    .select(agentListColumns)
    .from(agents)
    .where(
      and(
        eq(agents.organizationId, organizationId),
        ne(agents.status, "archived")
      )
    )
    .orderBy(desc(agents.createdAt));

  if (agentRows.length === 0) {
    return [];
  }

  const [
    tools,
    skills,
    channels,
    connections,
    subagents,
    scheduledTasks,
    workflowTasks,
  ] = await Promise.all([
    db.select({ agentId: agentTools.agentId }).from(agentTools),
    db.select({ agentId: agentSkills.agentId }).from(agentSkills),
    db.select({ agentId: agentChannels.agentId }).from(agentChannels),
    db.select({ agentId: agentConnections.agentId }).from(agentConnections),
    db.select({ agentId: agentSubagents.agentId }).from(agentSubagents),
    db
      .select({ agentId: agentScheduledTasks.agentId })
      .from(agentScheduledTasks),
    db.select({ agentId: agentWorkflowTasks.agentId }).from(agentWorkflowTasks),
  ]);

  const toolCounts = countByAgentId(tools);
  const skillCounts = countByAgentId(skills);
  const channelCounts = countByAgentId(channels);
  const connectionCounts = countByAgentId(connections);
  const subagentCounts = countByAgentId(subagents);
  const scheduledTaskCounts = countByAgentId(scheduledTasks);
  const workflowTaskCounts = countByAgentId(workflowTasks);

  return agentRows.map((agent) => ({
    ...agent,
    resourceCounts: {
      tools: toolCounts.get(agent.id) ?? 0,
      skills: skillCounts.get(agent.id) ?? 0,
      channels: channelCounts.get(agent.id) ?? 0,
      connections: connectionCounts.get(agent.id) ?? 0,
      subagents: subagentCounts.get(agent.id) ?? 0,
      scheduledTasks: scheduledTaskCounts.get(agent.id) ?? 0,
      workflowTasks: workflowTaskCounts.get(agent.id) ?? 0,
    },
  }));
}

export async function getOrganizationAgent(
  organizationId: string,
  agentSlug: string
): Promise<AgentDetailData | null> {
  const db = getDb();
  const [agent] = await db
    .select(agentListColumns)
    .from(agents)
    .where(
      and(eq(agents.organizationId, organizationId), eq(agents.slug, agentSlug))
    )
    .limit(1);

  if (!agent) {
    return null;
  }

  const [
    tools,
    skills,
    channels,
    connections,
    subagents,
    scheduledTasks,
    workflowTasks,
    deployments,
  ] = await Promise.all([
    db.select().from(agentTools).where(eq(agentTools.agentId, agent.id)),
    db.select().from(agentSkills).where(eq(agentSkills.agentId, agent.id)),
    db.select().from(agentChannels).where(eq(agentChannels.agentId, agent.id)),
    db
      .select()
      .from(agentConnections)
      .where(eq(agentConnections.agentId, agent.id)),
    db
      .select()
      .from(agentSubagents)
      .where(eq(agentSubagents.agentId, agent.id)),
    db
      .select()
      .from(agentScheduledTasks)
      .where(eq(agentScheduledTasks.agentId, agent.id)),
    db
      .select()
      .from(agentWorkflowTasks)
      .where(eq(agentWorkflowTasks.agentId, agent.id)),
    db
      .select()
      .from(agentDeployments)
      .where(eq(agentDeployments.agentId, agent.id))
      .orderBy(desc(agentDeployments.createdAt)),
  ]);

  const latestDeployment = deployments[0];
  const deploymentEvents = latestDeployment
    ? await db
        .select()
        .from(agentDeploymentEvents)
        .where(eq(agentDeploymentEvents.deploymentId, latestDeployment.id))
        .orderBy(desc(agentDeploymentEvents.createdAt))
    : [];

  return {
    ...agent,
    resourceCounts: {
      tools: tools.length,
      skills: skills.length,
      channels: channels.length,
      connections: connections.length,
      subagents: subagents.length,
      scheduledTasks: scheduledTasks.length,
      workflowTasks: workflowTasks.length,
    },
    tools,
    skills,
    channels,
    connections,
    subagents,
    scheduledTasks,
    workflowTasks,
    deployments,
    deploymentEvents,
  };
}

export async function isAgentSlugTaken(
  organizationId: string,
  slug: string
): Promise<boolean> {
  const db = getDb();
  const existing = await db
    .select({ id: agents.id })
    .from(agents)
    .where(
      and(eq(agents.organizationId, organizationId), eq(agents.slug, slug))
    )
    .limit(1);

  return existing.length > 0;
}

export async function allocateAgentSlug(
  organizationId: string,
  name: string
): Promise<string> {
  const base = slugifyAgentName(name);
  if (!(await isAgentSlugTaken(organizationId, base))) {
    return base;
  }

  for (let attempt = 0; attempt < 8; attempt++) {
    const suffix = crypto.randomUUID().slice(0, 6);
    const candidate = `${base.slice(0, 40)}-${suffix}`;
    if (!(await isAgentSlugTaken(organizationId, candidate))) {
      return candidate;
    }
  }

  return `${base.slice(0, 32)}-${crypto.randomUUID().slice(0, 8)}`;
}
