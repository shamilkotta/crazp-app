import { notFound } from "next/navigation";

import { CatalogListingDrawer } from "@/components/catalog-listing-drawer";
import { listOrganizationAgents } from "@/lib/agents";
import { catalogItem } from "@/lib/catalog";
import { requireTeam } from "@/lib/team";

export default async function CatalogListingDrawerPage({
  params,
}: {
  params: Promise<{ teamSlug: string; slug: string }>;
}) {
  const { teamSlug, slug } = await params;
  const { organization } = await requireTeam(teamSlug);
  const item = catalogItem(slug);
  if (!item) {
    notFound();
  }
  const agents = await listOrganizationAgents(organization.id);
  return (
    <CatalogListingDrawer item={item} agents={agents} teamSlug={teamSlug} />
  );
}
