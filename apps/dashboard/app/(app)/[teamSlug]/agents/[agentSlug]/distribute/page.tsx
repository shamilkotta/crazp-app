import { DistributeView } from "@/components/distribute-view";
import { requireTeamAgent } from "@/lib/team";

export default async function AgentDistributePage({
  params,
}: {
  params: Promise<{ teamSlug: string; agentSlug: string }>;
}) {
  const { teamSlug, agentSlug } = await params;
  const { agent } = await requireTeamAgent(teamSlug, agentSlug);
  return <DistributeView agent={agent} />;
}
