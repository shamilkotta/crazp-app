import { RunsView } from "@/components/runs-view";
import { requireTeamAgent } from "@/lib/team";

export default async function AgentRunsPage({
  params,
}: {
  params: Promise<{ teamSlug: string; agentSlug: string }>;
}) {
  const { teamSlug, agentSlug } = await params;
  const { agent } = await requireTeamAgent(teamSlug, agentSlug);
  return <RunsView agent={agent} />;
}
