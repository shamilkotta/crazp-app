import { and, desc, eq, ne } from "drizzle-orm";
import { agents, type Agent } from "@workspace/db/schema";
import { getDb } from "@/lib/db";

export type AgentListItem = {
  id: string;
  name: string;
  slug: string;
  instructions: string;
  model: string;
  status: Agent["status"];
  lastRunAt: Date | null;
  createdAt: Date;
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
  status: agents.status,
  lastRunAt: agents.lastRunAt,
  createdAt: agents.createdAt,
} as const;

export async function listOrganizationAgents(
  organizationId: string
): Promise<AgentListItem[]> {
  const db = getDb();

  return db
    .select(agentListColumns)
    .from(agents)
    .where(
      and(
        eq(agents.organizationId, organizationId),
        ne(agents.status, "archived")
      )
    )
    .orderBy(desc(agents.createdAt));
}

export async function getOrganizationAgent(
  organizationId: string,
  agentId: string
): Promise<AgentListItem | null> {
  const db = getDb();
  const [agent] = await db
    .select(agentListColumns)
    .from(agents)
    .where(
      and(eq(agents.organizationId, organizationId), eq(agents.id, agentId))
    )
    .limit(1);

  return agent ?? null;
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
