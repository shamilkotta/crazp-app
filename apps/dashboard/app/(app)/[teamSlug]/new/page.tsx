import { Suspense } from "react";
import { CreateAgentForm } from "@/components/create-agent-form";
import { listCatalogTemplates } from "@/lib/catalog-query";
import { requireTeam } from "@/lib/team";

export default async function NewAgentPage({
  params,
}: {
  params: Promise<{ teamSlug: string }>;
}) {
  const { teamSlug } = await params;
  await requireTeam(teamSlug);
  const templates = await listCatalogTemplates();

  return (
    <Suspense>
      <CreateAgentForm teamSlug={teamSlug} templates={templates} />
    </Suspense>
  );
}
