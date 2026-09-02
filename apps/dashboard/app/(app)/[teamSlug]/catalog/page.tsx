import { CatalogView } from "@/components/catalog-view";
import { listCatalog } from "@/lib/catalog-query";
import { requireTeam } from "@/lib/team";

export default async function CatalogPage({
  params,
}: {
  params: Promise<{ teamSlug: string }>;
}) {
  const { teamSlug } = await params;
  await requireTeam(teamSlug);
  const items = await listCatalog();
  return <CatalogView teamSlug={teamSlug} items={items} />;
}
