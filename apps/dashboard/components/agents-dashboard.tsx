"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bot,
  CheckCircle2,
  LayoutGrid,
  List,
  MoreHorizontal,
  Plus,
  Search,
} from "lucide-react";
import type { AgentListItem } from "@/lib/agents";
import { usageStats } from "@/lib/mock-data";
import { formatRelativeTime } from "@/lib/format";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader } from "@workspace/ui/components/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty";
import { Input } from "@workspace/ui/components/input";
import { cn } from "@workspace/ui/lib/utils";

function StatusDot({ status }: { status: AgentListItem["status"] }) {
  const colors: Record<AgentListItem["status"], string> = {
    active: "bg-emerald-500",
    draft: "bg-foreground/40",
    paused: "bg-amber-500",
    error: "bg-red-500",
    deploying: "bg-sky-500",
    archived: "bg-foreground/30",
  };
  return <span className={cn("size-2 rounded-full", colors[status])} />;
}

function UsageSidebar() {
  return (
    <aside className="hidden w-56 shrink-0 lg:block">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <h3 className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
            Usage
          </h3>
          {[
            {
              label: "Agent runs",
              used: usageStats.agentRuns.used,
              limit: usageStats.agentRuns.limit,
            },
            {
              label: "Tokens",
              used: usageStats.tokens.used,
              limit: usageStats.tokens.limit,
              suffix: "M",
            },
            {
              label: "Storage",
              used: usageStats.storage.used,
              limit: usageStats.storage.limit,
              suffix: "GB",
            },
          ].map((item) => (
            <div key={item.label} className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{item.label}</span>
                <span>
                  {item.used}
                  {item.suffix ?? ""} / {item.limit}
                  {item.suffix ?? ""}
                </span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-foreground/70"
                  style={{ width: `${(item.used / item.limit) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" className="w-full">
          Upgrade
        </Button>
      </div>
    </aside>
  );
}

function AgentsEmptyState({ createHref }: { createHref: string }) {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Bot />
        </EmptyMedia>
        <EmptyTitle>No agents yet</EmptyTitle>
        <EmptyDescription>
          Create your first agent to automate workflows, answer questions, and
          take action for your team.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button render={<Link href={createHref} />} nativeButton={false}>
          <Plus data-icon="inline-start" />
          Create Agent
        </Button>
      </EmptyContent>
    </Empty>
  );
}

function agentPreview(instructions: string, maxLength = 120) {
  const trimmed = instructions.trim().replace(/\s+/g, " ");
  if (!trimmed) return "No instructions yet";
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength).trimEnd()}…`;
}

export function AgentsDashboard({
  agents,
  teamSlug,
}: {
  agents: AgentListItem[];
  teamSlug: string;
}) {
  const [view, setView] = useState<"grid" | "list">("grid");
  const isEmpty = agents.length === 0;
  const createHref = `/${teamSlug}/new`;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Agents</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Build and manage AI agents for your organization.
        </p>
      </div>

      {isEmpty ? (
        <AgentsEmptyState createHref={createHref} />
      ) : (
        <div className="flex gap-8">
          <UsageSidebar />
          <div className="flex min-w-0 flex-1 flex-col gap-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 sm:max-w-sm">
                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search agents..." className="ps-9" />
              </div>
              <div className="flex h-8 items-center gap-2">
                <div className="flex h-8 items-center rounded-lg border border-border">
                  <Button
                    variant={view === "grid" ? "secondary" : "ghost"}
                    size="icon"
                    className="rounded-e-none"
                    onClick={() => setView("grid")}
                  >
                    <LayoutGrid />
                  </Button>
                  <Button
                    variant={view === "list" ? "secondary" : "ghost"}
                    size="icon"
                    className="rounded-s-none"
                    onClick={() => setView("list")}
                  >
                    <List />
                  </Button>
                </div>
                <Button
                  render={<Link href={createHref} />}
                  nativeButton={false}
                >
                  <Plus data-icon="inline-start" />
                  Create Agent
                </Button>
              </div>
            </div>

            {view === "grid" ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {agents.map((agent) => (
                  <Link key={agent.id} href={`/${teamSlug}/agents/${agent.id}`}>
                    <Card className="h-full transition-colors hover:border-foreground/30">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-lg border border-border bg-muted">
                              <Bot className="size-5" />
                            </div>
                            <div>
                              <p className="leading-none font-medium">
                                {agent.name}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {agent.slug}.crazp.dev
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={(e) => e.preventDefault()}
                          >
                            <MoreHorizontal />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="flex flex-col gap-3">
                        <p className="text-sm text-muted-foreground">
                          {agentPreview(agent.instructions)}
                        </p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="truncate">{agent.model}</span>
                          <div className="flex items-center gap-1.5">
                            <StatusDot status={agent.status} />
                            {agent.lastRunAt
                              ? formatRelativeTime(agent.lastRunAt)
                              : agent.status}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="divide-y divide-border rounded-xl border border-border">
                {agents.map((agent) => (
                  <Link
                    key={agent.id}
                    href={`/${teamSlug}/agents/${agent.id}`}
                    className="flex items-center gap-4 px-4 py-4 transition-colors hover:bg-muted sm:px-5"
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted">
                      <Bot className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{agent.name}</p>
                        <Badge
                          variant="outline"
                          className="hidden sm:inline-flex"
                        >
                          {agent.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {agentPreview(agent.instructions)}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {agent.model}
                      </p>
                    </div>
                    <div className="hidden items-center gap-3 sm:flex">
                      <span className="text-xs text-muted-foreground">
                        {agent.lastRunAt
                          ? formatRelativeTime(agent.lastRunAt)
                          : "Never run"}
                      </span>
                      <CheckCircle2
                        className={cn(
                          "size-4",
                          agent.status === "active"
                            ? "text-emerald-500"
                            : "text-muted-foreground/50"
                        )}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="shrink-0"
                      onClick={(e) => e.preventDefault()}
                    >
                      <MoreHorizontal />
                    </Button>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
