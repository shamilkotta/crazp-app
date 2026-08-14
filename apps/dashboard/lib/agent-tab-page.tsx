import { notFound } from "next/navigation";

import { AgentDetailPage } from "@/components/agent-detail";
import type { AgentTab } from "@/components/board/agent-types";
import { getOrganizationAgent } from "@/lib/agents";
import { requireTeam } from "@/lib/team";

export async function AgentTabPage({
  params,
  tab,
}: {
  params: Promise<{ teamSlug: string; agentSlug: string }>;
  tab: AgentTab;
}) {
  const { teamSlug, agentSlug } = await params;
  const { organization } = await requireTeam(teamSlug);
  const agent = await getOrganizationAgent(organization.id, agentSlug);
  if (!agent) {
    notFound();
  }

  return <AgentDetailPage agent={agent} teamSlug={teamSlug} tab={tab} />;
}
