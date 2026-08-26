import { and, desc, eq, inArray, ne } from "drizzle-orm";
import { nanoid } from "nanoid";
import { cache } from "react";
import { slugifyAgentName } from "@/lib/display";
import {
  channels as agentChannels,
  connections as agentConnections,
  deploymentEvents as agentDeploymentEvents,
  deployments as agentDeployments,
  scheduledTasks as agentScheduledTasks,
  skills as agentSkills,
  skillResources as agentSkillResources,
  subagents as agentSubagents,
  tools as agentTools,
  workflowTasks as agentWorkflowTasks,
  agents,
  type Agent,
  type AgentChannel,
  type AgentConnection,
  type AgentDeployment,
  type AgentDeploymentEvent,
  type AgentScheduledTask,
  type AgentSkill,
  type AgentSkillResource,
  type AgentSubagent,
  type AgentTool,
  type AgentWorkflowTask,
  subagents,
} from "@workspace/db/schema";
import { getDb } from "@/lib/db";

export type AgentSkillDetail = AgentSkill & {
  resources: AgentSkillResource[];
};

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
  skills: AgentSkillDetail[];
  channels: AgentChannel[];
  connections: AgentConnection[];
  subagents: AgentSubagent[];
  scheduledTasks: AgentScheduledTask[];
  workflowTasks: AgentWorkflowTask[];
  deployments: AgentDeployment[];
  deploymentEvents: AgentDeploymentEvent[];
};

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

export const listOrganizationAgents = cache(
  async (organizationId: string): Promise<AgentListItem[]> => {
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

    const agentIds = agentRows.map((agent) => agent.id);
    const [
      tools,
      skills,
      channels,
      connections,
      subagents,
      scheduledTasks,
      workflowTasks,
    ] = await Promise.all([
      db
        .select({ agentId: agentTools.agentId })
        .from(agentTools)
        .where(inArray(agentTools.agentId, agentIds)),
      db
        .select({ agentId: agentSkills.agentId })
        .from(agentSkills)
        .where(inArray(agentSkills.agentId, agentIds)),
      db
        .select({ agentId: agentChannels.agentId })
        .from(agentChannels)
        .where(inArray(agentChannels.agentId, agentIds)),
      db
        .select({ agentId: agentConnections.agentId })
        .from(agentConnections)
        .where(inArray(agentConnections.agentId, agentIds)),
      db
        .select({ agentId: agentSubagents.agentId })
        .from(agentSubagents)
        .where(inArray(agentSubagents.agentId, agentIds)),
      db
        .select({ agentId: agentScheduledTasks.agentId })
        .from(agentScheduledTasks)
        .where(inArray(agentScheduledTasks.agentId, agentIds)),
      db
        .select({ agentId: agentWorkflowTasks.agentId })
        .from(agentWorkflowTasks)
        .where(inArray(agentWorkflowTasks.agentId, agentIds)),
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
);

export const getOrganizationAgent = cache(
  async (
    organizationId: string,
    agentSlug: string
  ): Promise<AgentDetailData | null> => {
    const db = getDb();
    const [agent] = await db
      .select(agentListColumns)
      .from(agents)
      .where(
        and(
          eq(agents.organizationId, organizationId),
          eq(agents.slug, agentSlug)
        )
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
      db
        .select()
        .from(agentChannels)
        .where(eq(agentChannels.agentId, agent.id)),
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
    const [deploymentEvents, skillResourceRows] = await Promise.all([
      latestDeployment
        ? db
            .select()
            .from(agentDeploymentEvents)
            .where(eq(agentDeploymentEvents.deploymentId, latestDeployment.id))
            .orderBy(desc(agentDeploymentEvents.createdAt))
        : Promise.resolve([] as AgentDeploymentEvent[]),
      skills.length > 0
        ? db
            .select()
            .from(agentSkillResources)
            .where(
              inArray(
                agentSkillResources.skillId,
                skills.map((skill) => skill.id)
              )
            )
        : Promise.resolve([] as AgentSkillResource[]),
    ]);

    const resourcesBySkillId = new Map<string, AgentSkillResource[]>();
    for (const resource of skillResourceRows) {
      const list = resourcesBySkillId.get(resource.skillId);
      if (list) list.push(resource);
      else resourcesBySkillId.set(resource.skillId, [resource]);
    }

    const skillsWithResources: AgentSkillDetail[] = skills.map((skill) => ({
      ...skill,
      resources: resourcesBySkillId.get(skill.id) ?? [],
    }));

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
      skills: skillsWithResources,
      channels,
      connections,
      subagents,
      scheduledTasks,
      workflowTasks,
      deployments,
      deploymentEvents,
    };
  }
);

async function isAgentSlugTaken(slug: string): Promise<boolean> {
  const db = getDb();
  const existing = await db
    .select({ id: agents.id })
    .from(agents)
    .where(and(eq(agents.slug, slug)))
    .limit(1);

  return existing.length > 0;
}

export async function allocateAgentSlug(name: string): Promise<string> {
  const base = slugifyAgentName(name);
  if (!(await isAgentSlugTaken(base))) {
    return base;
  }
  return `${base.slice(0, 32)}-${nanoid(8)}`;
}

export async function allocateSubagentSlug(
  agentId: string,
  name: string
): Promise<string> {
  const base = slugifyAgentName(name);
  if (!(await isSubagentSlugTaken(agentId, base))) {
    return base;
  }
  return `${base.slice(0, 32)}-${nanoid(8)}`;
}

async function isSubagentSlugTaken(
  agentId: string,
  slug: string
): Promise<boolean> {
  const db = getDb();
  const existing = await db
    .select({ id: subagents.id })
    .from(subagents)
    .where(and(eq(subagents.agentId, agentId), eq(subagents.slug, slug)))
    .limit(1);
  return existing.length > 0;
}
