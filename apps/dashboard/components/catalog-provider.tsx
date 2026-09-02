"use client";

import { createContext, useContext } from "react";

import type { CatalogItem, CatalogKind } from "@/lib/catalog";

const CatalogContext = createContext<CatalogItem[]>([]);

export function CatalogProvider({
  items,
  children,
}: {
  items: CatalogItem[];
  children: React.ReactNode;
}) {
  return (
    <CatalogContext.Provider value={items}>{children}</CatalogContext.Provider>
  );
}

export function useCatalog() {
  return useContext(CatalogContext);
}

export function useCatalogKind(kind: CatalogKind) {
  return useCatalog().filter((item) => item.kind === kind);
}
