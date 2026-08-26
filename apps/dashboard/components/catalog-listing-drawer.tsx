"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { AgentListItem } from "@/lib/agents";
import type { CatalogItem } from "@/lib/catalog";
import { ListingView } from "@/components/listing-view";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet";

export function CatalogListingDrawer({
  item,
  agents,
  teamSlug,
}: {
  item: CatalogItem;
  agents: AgentListItem[];
  teamSlug: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          // Prefer back so forward reopens the drawer (intercepting-routes UX).
          // Fall back when there is no in-app history entry.
          if (window.history.length > 1) {
            router.back();
          } else {
            router.push(`/${teamSlug}/catalog`);
          }
        }
      }}
    >
      <SheetContent
        side="right"
        className="gap-0 overflow-y-auto p-0 data-[side=right]:w-[92%] data-[side=right]:sm:max-w-3xl"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>{item.name}</SheetTitle>
          <SheetDescription>{item.description}</SheetDescription>
        </SheetHeader>
        <div className="p-4 sm:p-6">
          <ListingView
            item={item}
            agents={agents}
            teamSlug={teamSlug}
            variant="drawer"
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
