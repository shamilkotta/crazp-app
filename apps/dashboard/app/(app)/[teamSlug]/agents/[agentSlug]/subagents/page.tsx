import { AgentTabPage } from "@/lib/agent-tab-page";

export default function AgentSubagentsPage({
  params,
}: {
  params: Promise<{ teamSlug: string; agentSlug: string }>;
}) {
  return <AgentTabPage params={params} tab="subagents" />;
}
