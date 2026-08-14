import { notFound } from "next/navigation";
import { PlaygroundView } from "@/components/playground-view";
import { getOrganizationAgent } from "@/lib/agents";
import { requireTeam } from "@/lib/team";

export default async function AgentPlaygroundPage({
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
  return <PlaygroundView agent={agent} />;
}
