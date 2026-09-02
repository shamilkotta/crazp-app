"use client";

import { Plus, Puzzle } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import type { CatalogKind } from "@/lib/catalog";
import { useCatalog } from "@/components/catalog-provider";
import {
  Empty,
  GhostButton,
  PrimaryButton,
  Surface,
  TextButton,
  inputClass,
} from "@/components/board/ui";
import { cn } from "@workspace/ui/lib/utils";

type ResourceItem = {
  id: string;
  title: string;
  meta: string;
  body: string;
  enabled: boolean;
};

export function ResourceList({
  title,
  blurb,
  kind,
  empty,
  items,
  catalogHref,
  listingHref,
  pending,
  onToggle,
  onDelete,
  onCreate,
}: {
  title: string;
  blurb: string;
  kind?: CatalogKind;
  empty: string;
  items: ResourceItem[];
  catalogHref: string;
  listingHref: (slug: string) => string;
  pending?: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onCreate: (title: string) => void;
}) {
  const catalog = useCatalog();
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState("");
  const suggestions = useMemo(
    () =>
      kind ? catalog.filter((item) => item.kind === kind).slice(0, 4) : [],
    [catalog, kind]
  );

  function addDraft() {
    if (!draft.trim()) return;
    onCreate(draft.trim());
    setDraft("");
    setCreating(false);
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-medium">{title}</h2>
          <p className="mt-1 max-w-xl text-[13px] text-muted-foreground">
            {blurb}
          </p>
        </div>
        <div className="flex gap-2">
          {kind ? (
            <Link href={catalogHref}>
              <GhostButton>
                <Puzzle className="size-3.5" />
                From catalog
              </GhostButton>
            </Link>
          ) : null}
          <PrimaryButton onClick={() => setCreating(true)} disabled={pending}>
            <Plus className="size-3.5" />
            Create
          </PrimaryButton>
        </div>
      </div>

      {creating ? (
        <Surface className="mb-3 flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
          <input
            autoFocus
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") addDraft();
              if (event.key === "Escape") setCreating(false);
            }}
            placeholder={`Name this ${title.slice(0, -1).toLowerCase()}…`}
            className={cn(inputClass, "min-w-0 flex-1")}
          />
          <div className="flex shrink-0 gap-2">
            <GhostButton onClick={() => setCreating(false)}>Cancel</GhostButton>
            <PrimaryButton onClick={addDraft} disabled={pending}>
              Add
            </PrimaryButton>
          </div>
        </Surface>
      ) : null}

      {items.length === 0 && !creating ? (
        <Surface>
          <Empty title={`No ${title.toLowerCase()}`} body={empty} />
        </Surface>
      ) : (
        <Surface>
          {items.map((item, index) => (
            <div
              key={item.id}
              className={cn(
                "flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start sm:gap-3",
                index < items.length - 1 && "border-b border-border",
                !item.enabled && "opacity-50"
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium">{item.title}</p>
                <p className="truncate text-[12px] text-muted-foreground">
                  {item.meta}
                </p>
                {item.body ? (
                  <p className="mt-1 line-clamp-2 text-[12px] text-muted-foreground">
                    {item.body}
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <TextButton
                  disabled={pending}
                  onClick={() => onToggle(item.id)}
                >
                  {item.enabled ? "Enabled" : "Muted"}
                </TextButton>
                <TextButton
                  className="hover:text-red-500"
                  disabled={pending}
                  onClick={() => onDelete(item.id)}
                >
                  Remove
                </TextButton>
              </div>
            </div>
          ))}
        </Surface>
      )}

      {suggestions.length > 0 ? (
        <div className="mt-6">
          <p className="mb-2 text-[12px] font-medium text-muted-foreground">
            Suggested from catalog
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {suggestions.map((item) => (
              <Link key={item.id} href={listingHref(item.slug)}>
                <Surface className="p-4 transition-colors hover:bg-muted/40">
                  <p className="font-medium">{item.name}</p>
                  <p className="mt-0.5 line-clamp-2 text-[12px] text-muted-foreground">
                    {item.summary}
                  </p>
                </Surface>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
