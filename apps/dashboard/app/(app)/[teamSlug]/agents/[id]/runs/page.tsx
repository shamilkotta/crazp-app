import { notFound } from "next/navigation";
import { RunsView } from "@/components/runs-view";
import { getOrganizationAgent } from "@/lib/agents";
import { requireTeam } from "@/lib/team";

export default async function AgentRunsPage({
  params,
}: {
  params: Promise<{ teamSlug: string; id: string }>;
}) {
  const { teamSlug, id } = await params;
  const { organization } = await requireTeam(teamSlug);
  const agent = await getOrganizationAgent(organization.id, id);
  if (!agent) {
    notFound();
  }
  return <RunsView agent={agent} />;
}
