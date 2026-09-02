import type {
  CatalogField,
  CatalogItemRow,
  CatalogKind,
  CatalogSource,
} from "@workspace/db/schema";

export type { CatalogField, CatalogKind, CatalogSource };

export type CatalogItem = {
  id: string;
  kind: CatalogKind;
  slug: string;
  name: string;
  summary: string;
  description: string;
  author: { name: string; handle: string; verified: boolean };
  source: CatalogSource;
  version: string;
  updatedAt: Date;
  installs: number;
  tags: string[];
  requires: string[];
  fields: CatalogField[];
  includes?: string[];
  featured: boolean;
  published: boolean;
  provider?: string;
  hasWebhook: boolean;
};

export const catalogKinds: Array<{
  kind: CatalogKind;
  label: string;
  plural: string;
  blurb: string;
}> = [
  {
    kind: "tool",
    label: "Tool",
    plural: "Tools",
    blurb: "Things an agent can do",
  },
  {
    kind: "skill",
    label: "Skill",
    plural: "Skills",
    blurb: "How it should think",
  },
  {
    kind: "channel",
    label: "Channel",
    plural: "Channels",
    blurb: "Where it listens",
  },
  {
    kind: "connection",
    label: "Connection",
    plural: "Connections",
    blurb: "Accounts it acts on behalf of",
  },
  {
    kind: "subagent",
    label: "Subagent",
    plural: "Subagents",
    blurb: "Specialists it delegates to",
  },
  {
    kind: "template",
    label: "Template",
    plural: "Templates",
    blurb: "A whole agent to start from",
  },
];

export function catalogSourceLabel(source: CatalogItem["source"]) {
  return source === "builtin" ? "crazp" : "Community";
}

export function catalogChannelProvider(item: CatalogItem) {
  return item.provider || item.slug;
}

export function toCatalogItem(row: CatalogItemRow): CatalogItem {
  return {
    id: row.id,
    kind: row.kind,
    slug: row.slug,
    name: row.name,
    summary: row.summary,
    description: row.description,
    author: {
      name: row.authorName,
      handle: row.authorHandle,
      verified: row.authorVerified,
    },
    source: row.source,
    version: row.version,
    updatedAt: row.updatedAt,
    installs: row.installs,
    tags: row.tagsJson ?? [],
    requires: row.requiresJson ?? [],
    fields: row.fieldsJson ?? [],
    includes: row.includesJson ?? undefined,
    featured: row.featured,
    published: row.published,
    provider: row.provider ?? undefined,
    hasWebhook: row.hasWebhook,
  };
}
