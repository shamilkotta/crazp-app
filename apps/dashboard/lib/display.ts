import type { AgentListItem } from "@/lib/agents";
import { formatRelativeTime } from "@/lib/format";

export function agentInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "A";
  if (parts.length === 1) return (parts[0] ?? "A").slice(0, 2).toUpperCase();
  return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
}

/** Stable hue from a name so marks stay the same across renders. */
export function markHue(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 360;
}

export const statusLabel: Record<AgentListItem["status"], string> = {
  active: "Live",
  deploying: "Deploying",
  paused: "Paused",
  error: "Failed",
  draft: "Draft",
  archived: "Archived",
};

export const capabilities = [
  {
    key: "tools",
    label: "Tools",
    singular: "tool",
    blurb: "Things it can do",
  },
  {
    key: "skills",
    label: "Skills",
    singular: "skill",
    blurb: "How it should think",
  },
  {
    key: "channels",
    label: "Channels",
    singular: "channel",
    blurb: "Where it listens",
  },
  {
    key: "connections",
    label: "Connections",
    singular: "connection",
    blurb: "What it can reach",
  },
  {
    key: "subagents",
    label: "Subagents",
    singular: "subagent",
    blurb: "Who it delegates to",
  },
  {
    key: "scheduledTasks",
    label: "Schedules",
    singular: "schedule",
    blurb: "When it wakes up",
  },
  {
    key: "workflowTasks",
    label: "Workflows",
    singular: "workflow",
    blurb: "Sequences it follows",
  },
] as const satisfies ReadonlyArray<{
  key: keyof AgentListItem["resourceCounts"];
  label: string;
  singular: string;
  blurb: string;
}>;

export function completeness(agent: AgentListItem) {
  const checks = [
    agent.instructions.trim().length > 0,
    ...capabilities.map((cap) => agent.resourceCounts[cap.key] > 0),
  ];
  const done = checks.filter(Boolean).length;
  return Math.round((done / checks.length) * 100);
}

export function shortModel(model: string) {
  return model.split("/").pop() ?? model;
}

export function since(date: Date | null) {
  if (!date) return "never";
  return formatRelativeTime(date);
}

export function describeCron(schedule: string) {
  const readable: Record<string, string> = {
    "0 8 * * 1-5": "every weekday at 08:00",
    "0 9 * * 1-5": "every weekday at 09:00",
    "0 17 * * 5": "Fridays at 17:00",
    "*/15 * * * *": "every 15 minutes",
  };
  return readable[schedule] ?? schedule;
}

export const statusOrder = [
  "active",
  "deploying",
  "paused",
  "error",
  "draft",
] as const;

export function formatCount(value: number) {
  if (value < 1_000) return String(value);
  if (value < 1_000_000) {
    return `${(value / 1_000).toFixed(value < 10_000 ? 1 : 0)}k`;
  }
  return `${(value / 1_000_000).toFixed(1)}m`;
}

export function slugifyTeamName(name: string) {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 32) || "team"
  );
}

export function slugifyAgentName(name: string) {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return slug;
}

export function agentPublicHost(agent: {
  slug: string;
  deploymentUrl: string | null;
}) {
  if (agent.deploymentUrl) {
    return agent.deploymentUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
  }
  return `${agent.slug}.crazp.dev`;
}

export function agentPublicUrl(agent: {
  slug: string;
  deploymentUrl: string | null;
}) {
  if (agent.deploymentUrl) return agent.deploymentUrl;
  return `https://${agent.slug}.crazp.dev`;
}
