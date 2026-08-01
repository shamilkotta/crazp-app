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
import { usageStats, type MockAgent } from "@/lib/mock-data";
import { cn } from "@workspace/ui/lib/utils";
import { formatRelativeTime } from "@/lib/format";
import { useRouter } from "next/navigation";

function StatusDot({ status }: { status: MockAgent["status"] }) {
  const colors = {
    active: "bg-emerald-500",
    draft: "bg-foreground/40",
    paused: "bg-amber-500",
    error: "bg-red-500",
  };
  return <span className={cn("h-2 w-2 rounded-full", colors[status])} />;
}

function UsageSidebar() {
  return (
    <aside className="hidden w-56 shrink-0 space-y-6 lg:block">
      <div className="space-y-4">
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
          <div key={item.label} className="space-y-1.5">
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
    </aside>
  );
}

function AgentsEmptyState({ teamSlug }: { teamSlug: string }) {
  const router = useRouter();
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
        <Button onClick={() => router.push(`/${teamSlug}/agents`)}>
          <Plus data-icon="inline-start" />
          Create Agent
        </Button>
      </EmptyContent>
    </Empty>
  );
}

export function AgentsDashboard({
  agents,
  teamSlug,
}: {
  agents: MockAgent[];
  teamSlug: string;
}) {
  const [view, setView] = useState<"grid" | "list">("grid");
  const isEmpty = agents.length === 0;
  const router = useRouter();
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Agents</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Build and manage AI agents for your organization.
          </p>
        </div>
        {!isEmpty ? (
          <Button
            size="sm"
            onClick={() => router.push(`/${teamSlug}/agents`)}
            className="shrink-0"
          >
            <Plus data-icon="inline-start" />
            Create Agent
          </Button>
        ) : null}
      </div>

      {isEmpty ? (
        <AgentsEmptyState teamSlug={teamSlug} />
      ) : (
        <div className="flex gap-8">
          <UsageSidebar />
          <div className="min-w-0 flex-1 space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 sm:max-w-sm">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search agents..." className="pl-9" />
              </div>
              <div className="flex items-center gap-2">
                <div className="flex rounded-md border border-border p-0.5">
                  <Button
                    variant={view === "grid" ? "secondary" : "ghost"}
                    size="icon-sm"
                    onClick={() => setView("grid")}
                  >
                    <LayoutGrid />
                  </Button>
                  <Button
                    variant={view === "list" ? "secondary" : "ghost"}
                    size="icon-sm"
                    onClick={() => setView("list")}
                  >
                    <List />
                  </Button>
                </div>
                <Button
                  size="sm"
                  onClick={() => router.push(`/${teamSlug}/agents`)}
                >
                  <Plus className="h-4 w-4" />
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
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-muted">
                              <Bot className="h-5 w-5" />
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
                      <CardContent className="space-y-3">
                        <p className="line-clamp-2 text-sm text-muted-foreground">
                          {agent.description}
                        </p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            {agent.provider} · {agent.model}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <StatusDot status={agent.status} />
                            {formatRelativeTime(agent.lastRunAt)}
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
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted">
                      <Bot className="h-5 w-5" />
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
                      <p className="truncate text-sm text-muted-foreground">
                        {agent.description}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {agent.provider} · {agent.model} · {agent.runsToday}{" "}
                        runs today
                      </p>
                    </div>
                    <div className="hidden items-center gap-3 sm:flex">
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(agent.lastRunAt)}
                      </span>
                      <CheckCircle2
                        className={cn(
                          "h-4 w-4",
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
