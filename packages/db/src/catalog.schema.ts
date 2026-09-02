import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const timestamp = (name: string) =>
  integer(name, { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull();

const updatedTimestamp = (name: string) =>
  integer(name, { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull();

export type CatalogKind =
  | "tool"
  | "skill"
  | "channel"
  | "connection"
  | "subagent"
  | "template";

export type CatalogSource = "builtin" | "community";

export type CatalogField = {
  key: string;
  label: string;
  type: "text" | "secret" | "url" | "select";
  placeholder?: string;
  options?: string[];
  required: boolean;
  help?: string;
};

export const catalogItems = sqliteTable(
  "catalog_items",
  {
    id: text("id").primaryKey(),
    kind: text("kind", {
      enum: ["tool", "skill", "channel", "connection", "subagent", "template"],
    }).notNull(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    summary: text("summary").notNull(),
    description: text("description").notNull(),
    authorName: text("author_name").notNull(),
    authorHandle: text("author_handle").notNull(),
    authorVerified: integer("author_verified", { mode: "boolean" })
      .notNull()
      .default(false),
    source: text("source", {
      enum: ["builtin", "community"],
    })
      .notNull()
      .default("builtin"),
    version: text("version").notNull().default("1.0.0"),
    installs: integer("installs").notNull().default(0),
    tagsJson: text("tags_json", { mode: "json" })
      .$type<string[]>()
      .notNull()
      .default([]),
    requiresJson: text("requires_json", { mode: "json" })
      .$type<string[]>()
      .notNull()
      .default([]),
    fieldsJson: text("fields_json", { mode: "json" })
      .$type<CatalogField[]>()
      .notNull()
      .default([]),
    includesJson: text("includes_json", { mode: "json" }).$type<string[]>(),
    featured: integer("featured", { mode: "boolean" }).notNull().default(false),
    published: integer("published", { mode: "boolean" })
      .notNull()
      .default(true),
    /** Channel provider key stored on `agent_channels.provider`. */
    provider: text("provider"),
    hasWebhook: integer("has_webhook", { mode: "boolean" })
      .notNull()
      .default(false),
    createdAt: timestamp("created_at"),
    updatedAt: updatedTimestamp("updated_at"),
  },
  (table) => [
    uniqueIndex("catalog_items_slug_idx").on(table.slug),
    index("catalog_items_kind_idx").on(table.kind),
    index("catalog_items_source_idx").on(table.source),
    index("catalog_items_published_idx").on(table.published),
    index("catalog_items_featured_idx").on(table.featured),
  ]
);

export type CatalogItemRow = typeof catalogItems.$inferSelect;
export type NewCatalogItem = typeof catalogItems.$inferInsert;
