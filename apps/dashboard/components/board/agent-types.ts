export type AgentTab =
  | "overview"
  | "setup"
  | "tools"
  | "skills"
  | "channels"
  | "connections"
  | "subagents"
  | "automations";

/** Secondary tabs under the agent Overview area (not Runs / Playground / Distribute). */
export const AGENT_OVERVIEW_TABS: readonly AgentTab[] = [
  "overview",
  "setup",
  "tools",
  "skills",
  "channels",
  "connections",
  "subagents",
  "automations",
] as const;

export function agentTabHref(
  teamSlug: string,
  agentSlug: string,
  tab: AgentTab
) {
  const base = `/${teamSlug}/agents/${agentSlug}`;
  return tab === "overview" ? base : `${base}/${tab}`;
}
