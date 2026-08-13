import { AgentsDashboard } from "@/components/agents-dashboard";
import { listOrganizationAgents } from "@/lib/agents";
import { requireTeam } from "@/lib/team";

export default async function TeamHomePage({
  params,
}: {
  params: Promise<{ teamSlug: string }>;
}) {
  const { teamSlug } = await params;
  const { organization } = await requireTeam(teamSlug);
  const agents = await listOrganizationAgents(organization.id);

  return <AgentsDashboard agents={agents} teamSlug={teamSlug} />;
}
