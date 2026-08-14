"use client";

import { ChevronDown, LayoutGrid, List, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import type { AgentListItem } from "@/lib/agents";
import {
  agentPublicHost,
  since,
  statusLabel,
  statusOrder,
} from "@/lib/display";
import { HomeRail } from "@/components/board/home-rail";
import {
  AgentMark,
  Empty,
  GhostButton,
  StatusDot,
  Surface,
} from "@/components/board/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { cn } from "@workspace/ui/lib/utils";

export function AgentsDashboard({
  agents,
  teamSlug,
}: {
  agents: AgentListItem[];
  teamSlug: string;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof statusOrder)[number] | "all">(
    "all"
  );
  const [layout, setLayout] = useState<"list" | "grid">("grid");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
      ) {
        return;
      }
      if (event.key === "/") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return agents.filter((agent) => {
      if (status !== "all" && agent.status !== status) return false;
      if (!q) return true;
      return (
        agent.name.toLowerCase().includes(q) ||
        agent.slug.toLowerCase().includes(q) ||
        agent.model.toLowerCase().includes(q)
      );
    });
  }, [agents, query, status]);

  const counts = statusOrder.map((key) => ({
    key,
    count: agents.filter((agent) => agent.status === key).length,
  }));

  if (agents.length === 0) {
    return (
      <div className="flex flex-col gap-6 lg:flex-row">
        <Surface className="order-1 min-w-0 flex-1">
          <Empty
            title="No agents yet"
            body="Create a draft, add a channel from the catalog, then deploy. It stays private until you do."
            action={
              <Link href={`/${teamSlug}/new`}>
                <GhostButton>
                  <Plus className="size-3.5" />
                  New agent
                </GhostButton>
              </Link>
            }
          />
        </Surface>
        <HomeRail agents={agents} teamSlug={teamSlug} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="order-1 min-w-0 flex-1">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search Agents"
              className="h-10 w-full rounded-lg border border-border bg-transparent pr-10 pl-9 text-[13px] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
            />
            <kbd className="pointer-events-none absolute top-1/2 right-2.5 hidden h-5 min-w-5 -translate-y-1/2 items-center justify-center rounded-md border border-border px-1 font-mono text-[11px] text-muted-foreground sm:inline-flex">
              /
            </kbd>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex h-10 shrink-0 items-center gap-1 rounded-lg border border-border p-1">
              <button
                type="button"
                onClick={() => setLayout("grid")}
                aria-label="Grid view"
                aria-pressed={layout === "grid"}
                className={cn(
                  "inline-flex aspect-square h-full items-center justify-center rounded-md",
                  layout === "grid"
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <LayoutGrid className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setLayout("list")}
                aria-label="List view"
                aria-pressed={layout === "list"}
                className={cn(
                  "inline-flex aspect-square h-full items-center justify-center rounded-md",
                  layout === "list"
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <List className="size-4" />
              </button>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    className="inline-flex h-10 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg bg-foreground px-3.5 text-[13px] font-medium text-background outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring sm:flex-none"
                  />
                }
              >
                <Plus className="size-4" />
                New agent
                <ChevronDown className="size-3.5 opacity-70" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-44">
                <DropdownMenuItem render={<Link href={`/${teamSlug}/new`} />}>
                  Blank agent
                </DropdownMenuItem>
                <DropdownMenuItem
                  render={<Link href={`/${teamSlug}/new?from=template`} />}
                >
                  From a template
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-1.5">
          <FilterChip
            active={status === "all"}
            onClick={() => setStatus("all")}
            label={`All ${agents.length}`}
          />
          {counts.map((item) =>
            item.count === 0 ? null : (
              <FilterChip
                key={item.key}
                active={status === item.key}
                onClick={() => setStatus(item.key)}
                label={`${statusLabel[item.key]} ${item.count}`}
                status={item.key}
              />
            )
          )}
        </div>

        {filtered.length === 0 ? (
          <Surface>
            <Empty
              title="No matching agents"
              body="Try a different status, or clear the search."
              action={
                <GhostButton
                  onClick={() => {
                    setQuery("");
                    setStatus("all");
                  }}
                >
                  Clear filters
                </GhostButton>
              }
            />
          </Surface>
        ) : layout === "list" ? (
          <Surface>
            {filtered.map((agent, index) => (
              <AgentRow
                key={agent.id}
                agent={agent}
                teamSlug={teamSlug}
                last={index === filtered.length - 1}
              />
            ))}
          </Surface>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((agent) => (
              <AgentCard key={agent.id} agent={agent} teamSlug={teamSlug} />
            ))}
          </div>
        )}
      </div>
      <HomeRail agents={agents} teamSlug={teamSlug} />
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  status,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  status?: AgentListItem["status"];
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[12px]",
        active
          ? "border-foreground/20 bg-muted font-medium"
          : "border-border text-muted-foreground hover:bg-muted/60"
      )}
    >
      {status ? <StatusDot status={status} /> : null}
      {label}
    </button>
  );
}

function AgentRow({
  agent,
  teamSlug,
  last,
}: {
  agent: AgentListItem;
  teamSlug: string;
  last: boolean;
}) {
  return (
    <Link
      href={`/${teamSlug}/agents/${agent.slug}`}
      className={cn(
        "flex items-center gap-3 px-4 py-3 hover:bg-muted/50",
        !last && "border-b border-border"
      )}
    >
      <AgentMark name={agent.name} size={32} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium">{agent.name}</p>
          <StatusDot status={agent.status} />
        </div>
        <p className="truncate text-[12px] text-muted-foreground">
          {agentPublicHost(agent)}
        </p>
      </div>
      <p className="hidden w-24 text-right text-[12px] text-muted-foreground sm:block">
        {agent.lastRunAt ? since(agent.lastRunAt) : "Never ran"}
      </p>
    </Link>
  );
}

function AgentCard({
  agent,
  teamSlug,
}: {
  agent: AgentListItem;
  teamSlug: string;
}) {
  return (
    <Link href={`/${teamSlug}/agents/${agent.slug}`}>
      <Surface className="h-full p-5 transition-colors hover:bg-muted/40">
        <div className="flex items-start justify-between gap-3">
          <AgentMark name={agent.name} />
          <StatusDot status={agent.status} />
        </div>
        <p className="mt-4 font-medium">{agent.name}</p>
        <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
          {agentPublicHost(agent)}
        </p>
        <p className="mt-4 text-[12px] text-muted-foreground">
          {agent.lastRunAt ? `Ran ${since(agent.lastRunAt)}` : "Never ran"}
        </p>
      </Surface>
    </Link>
  );
}
