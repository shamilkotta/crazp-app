"server-only";

import { and, desc, eq } from "drizzle-orm";
import { catalogItems, type CatalogKind } from "@workspace/db/schema";
import { getDb } from "@/lib/db";
import { toCatalogItem } from "@/lib/catalog";

export async function listCatalog(kind?: CatalogKind) {
  const db = getDb();
  const filters = [eq(catalogItems.published, true)];
  if (kind) filters.push(eq(catalogItems.kind, kind));
  const rows = await db
    .select()
    .from(catalogItems)
    .where(and(...filters))
    .orderBy(
      desc(catalogItems.featured),
      desc(catalogItems.installs),
      catalogItems.name
    );
  return rows.map(toCatalogItem);
}

export async function getCatalogItem(slug: string) {
  const db = getDb();
  const rows = await db
    .select()
    .from(catalogItems)
    .where(and(eq(catalogItems.slug, slug), eq(catalogItems.published, true)))
    .limit(1);
  const row = rows[0];
  return row ? toCatalogItem(row) : undefined;
}

export async function listCatalogTemplates() {
  return listCatalog("template");
}
