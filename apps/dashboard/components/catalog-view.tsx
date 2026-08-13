"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import {
  catalog,
  catalogKinds,
  catalogSourceLabel,
  featuredCatalogSlugs,
  type CatalogItem,
  type CatalogKind,
} from "@/lib/catalog";
import { formatCount, since } from "@/lib/display";
import { Empty, Surface, inputClass } from "@/components/board/ui";
import { cn } from "@workspace/ui/lib/utils";

export function CatalogView({ teamSlug }: { teamSlug: string }) {
  const [kind, setKind] = useState<CatalogKind | "all">("all");
  const [source, setSource] = useState<"all" | "builtin" | "community">("all");
  const [query, setQuery] = useState("");

  const featured = catalog.filter((item) =>
    featuredCatalogSlugs.includes(item.slug)
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalog.filter((item) => {
      if (kind !== "all" && item.kind !== kind) return false;
      if (source !== "all" && item.source !== source) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.tags.some((tag) => tag.includes(q))
      );
    });
  }, [kind, source, query]);

  return (
    <div>
      <p className="mb-6 max-w-xl text-[13px] text-muted-foreground">
        crazp and community pieces you can install onto an agent — tools,
        skills, channels, connections, subagents, and full templates.
      </p>

      <div className="relative mb-4 w-full max-w-md">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search the catalog…"
          className={cn(inputClass, "pl-8")}
        />
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        <Chip
          active={kind === "all"}
          onClick={() => setKind("all")}
          label="All"
        />
        {catalogKinds.map((item) => (
          <Chip
            key={item.kind}
            active={kind === item.kind}
            onClick={() => setKind(item.kind)}
            label={item.plural}
          />
        ))}
      </div>
      <div className="mb-8 flex flex-wrap gap-1.5">
        <Chip
          active={source === "all"}
          onClick={() => setSource("all")}
          label="Any source"
        />
        <Chip
          active={source === "builtin"}
          onClick={() => setSource("builtin")}
          label="crazp"
        />
        <Chip
          active={source === "community"}
          onClick={() => setSource("community")}
          label="Community"
        />
      </div>

      {kind === "all" && !query ? (
        <div className="mb-10">
          <p className="mb-3 text-[12px] font-medium text-muted-foreground">
            Featured
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {featured.map((item) => (
              <FeaturedCard key={item.id} item={item} teamSlug={teamSlug} />
            ))}
          </div>
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <Surface>
          <Empty
            title="Nothing in the catalog matches"
            body="Try a different kind, or search for Slack, Stripe, or web search."
          />
        </Surface>
      ) : (
        <>
          {kind === "all" && !query ? (
            <p className="mb-3 text-[12px] font-medium text-muted-foreground">
              All listings
            </p>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((item) => (
              <CatalogCard key={item.id} item={item} teamSlug={teamSlug} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Chip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-7 rounded-full border px-2.5 text-[12px]",
        active
          ? "border-foreground/20 bg-muted font-medium"
          : "border-border text-muted-foreground hover:bg-muted/60"
      )}
    >
      {label}
    </button>
  );
}

function FeaturedCard({
  item,
  teamSlug,
}: {
  item: CatalogItem;
  teamSlug: string;
}) {
  return (
    <Link href={`/${teamSlug}/catalog/${item.slug}`}>
      <Surface className="h-full p-4 transition-colors hover:bg-muted/40 sm:p-6">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            {item.kind}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {item.source === "builtin"
              ? catalogSourceLabel(item.source)
              : item.author.handle}
          </span>
        </div>
        <p className="mt-3 text-[18px] font-medium tracking-tight">
          {item.name}
        </p>
        <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-muted-foreground">
          {item.description}
        </p>
        <p className="mt-5 text-[12px] text-muted-foreground">
          {formatCount(item.installs)} installs · {since(item.updatedAt)}
        </p>
      </Surface>
    </Link>
  );
}

function CatalogCard({
  item,
  teamSlug,
}: {
  item: CatalogItem;
  teamSlug: string;
}) {
  return (
    <Link href={`/${teamSlug}/catalog/${item.slug}`}>
      <Surface className="h-full p-4 transition-colors hover:bg-muted/40">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            {item.kind}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {item.source === "builtin"
              ? catalogSourceLabel(item.source)
              : item.author.handle}
          </span>
        </div>
        <p className="mt-2 font-medium">{item.name}</p>
        <p className="mt-1 line-clamp-2 text-[12px] text-muted-foreground">
          {item.summary}
        </p>
        <p className="mt-3 text-[11px] text-muted-foreground">
          {formatCount(item.installs)} installs · {since(item.updatedAt)}
        </p>
      </Surface>
    </Link>
  );
}
