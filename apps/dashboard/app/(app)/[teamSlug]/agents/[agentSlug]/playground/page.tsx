import { PlaygroundView } from "@/components/playground-view";
import { requireTeamAgent } from "@/lib/team";

export default async function AgentPlaygroundPage({
  params,
}: {
  params: Promise<{ teamSlug: string; agentSlug: string }>;
}) {
  const { teamSlug, agentSlug } = await params;
  const { agent } = await requireTeamAgent(teamSlug, agentSlug);
  return <PlaygroundView agent={agent} />;
}
