import { notFound } from "next/navigation";
import { PlaygroundView } from "@/components/playground-view";
import { getOrganizationAgent } from "@/lib/agents";
import { requireTeam } from "@/lib/team";

export default async function AgentPlaygroundPage({
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
  return <PlaygroundView agent={agent} />;
}
