import { AgentDetailPage } from "@/components/agent-detail";
import type { AgentTab } from "@/components/board/agent-types";
import { requireTeamAgent } from "@/lib/team";

export async function AgentTabPage({
  params,
  tab,
}: {
  params: Promise<{ teamSlug: string; agentSlug: string }>;
  tab: AgentTab;
}) {
  const { teamSlug, agentSlug } = await params;
  const { agent } = await requireTeamAgent(teamSlug, agentSlug);

  return <AgentDetailPage agent={agent} teamSlug={teamSlug} tab={tab} />;
}
