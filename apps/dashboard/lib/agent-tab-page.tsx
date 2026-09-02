import { AgentDetailPage } from "@/components/agent-detail";
import type { AgentTab } from "@/components/board/agent-types";
import { listCatalog } from "@/lib/catalog-query";
import { requireTeamAgent } from "@/lib/team";

export async function AgentTabPage({
  params,
  tab,
}: {
  params: Promise<{ teamSlug: string; agentSlug: string }>;
  tab: AgentTab;
}) {
  const { teamSlug, agentSlug } = await params;
  const [{ agent }, catalog] = await Promise.all([
    requireTeamAgent(teamSlug, agentSlug),
    listCatalog(),
  ]);

  return (
    <AgentDetailPage
      agent={agent}
      teamSlug={teamSlug}
      tab={tab}
      catalog={catalog}
    />
  );
}
