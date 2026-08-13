import { CatalogView } from "@/components/catalog-view";
import { requireTeam } from "@/lib/team";

export default async function CatalogPage({
  params,
}: {
  params: Promise<{ teamSlug: string }>;
}) {
  const { teamSlug } = await params;
  await requireTeam(teamSlug);
  return <CatalogView teamSlug={teamSlug} />;
}
