import { notFound } from "next/navigation";
import { CreateAgentForm } from "@/components/create-agent-form";
import {
  findOrganizationBySlug,
  listUserOrganizations,
} from "@/lib/organization";
import { requireSession } from "@/lib/session";

export default async function NewAgentPage({
  params,
}: {
  params: Promise<{ teamSlug: string }>;
}) {
  const { teamSlug } = await params;
  const [, organizations] = await Promise.all([
    requireSession(),
    listUserOrganizations(),
  ]);
  const organization = findOrganizationBySlug(organizations, teamSlug);

  if (!organization) {
    notFound();
  }

  return <CreateAgentForm teamSlug={teamSlug} />;
}
