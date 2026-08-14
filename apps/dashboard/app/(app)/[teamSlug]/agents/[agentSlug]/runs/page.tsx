import { notFound } from "next/navigation";
import { RunsView } from "@/components/runs-view";
import { getOrganizationAgent } from "@/lib/agents";
import { requireTeam } from "@/lib/team";

export default async function AgentRunsPage({
  params,
}: {
  params: Promise<{ teamSlug: string; agentSlug: string }>;
}) {
  const { teamSlug, agentSlug } = await params;
  const { organization } = await requireTeam(teamSlug);
  const agent = await getOrganizationAgent(organization.id, agentSlug);
  if (!agent) {
    notFound();
  }
  return <RunsView agent={agent} />;
}
