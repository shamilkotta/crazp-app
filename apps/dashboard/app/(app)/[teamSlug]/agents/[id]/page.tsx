import { notFound } from "next/navigation";
import { AgentDetailPage } from "@/components/agent-detail";
import { getOrganizationAgent } from "@/lib/agents";
import {
  findOrganizationBySlug,
  listUserOrganizations,
} from "@/lib/organization";
import { requireSession } from "@/lib/session";

export default async function AgentPage({
  params,
}: {
  params: Promise<{ teamSlug: string; id: string }>;
}) {
  const { teamSlug, id } = await params;
  const [, organizations] = await Promise.all([
    requireSession(),
    listUserOrganizations(),
  ]);
  const organization = findOrganizationBySlug(organizations, teamSlug);

  if (!organization) {
    notFound();
  }

  const agent = await getOrganizationAgent(organization.id, id);
  if (!agent) {
    notFound();
  }

  return (
    <AgentDetailPage
      agent={agent}
      dashboardPath={`/${teamSlug}`}
      teamSlug={teamSlug}
    />
  );
}
