import { AgentTabPage } from "@/lib/agent-tab-page";

export default function AgentPage({
  params,
}: {
  params: Promise<{ teamSlug: string; agentSlug: string }>;
}) {
  return <AgentTabPage params={params} tab="overview" />;
}
