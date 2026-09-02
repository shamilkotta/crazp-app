import { notFound } from "next/navigation";
import { ListingView } from "@/components/listing-view";
import { listOrganizationAgents } from "@/lib/agents";
import { getCatalogItem } from "@/lib/catalog-query";
import { requireTeam } from "@/lib/team";

export default async function CatalogListingPage({
  params,
}: {
  params: Promise<{ teamSlug: string; slug: string }>;
}) {
  const { teamSlug, slug } = await params;
  const { organization } = await requireTeam(teamSlug);
  const item = await getCatalogItem(slug);
  if (!item) {
    notFound();
  }
  const agents = await listOrganizationAgents(organization.id);
  return <ListingView item={item} agents={agents} teamSlug={teamSlug} />;
}
