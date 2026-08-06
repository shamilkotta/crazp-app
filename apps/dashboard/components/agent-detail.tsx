"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";
import {
  Activity,
  ArrowLeft,
  Bot,
  Cable,
  FileText,
  Settings,
  Terminal,
} from "lucide-react";
import { deployAgent } from "@/lib/actions/agents";
import type { AgentListItem } from "@/lib/agents";
import { formatRelativeTime } from "@/lib/format";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Separator } from "@workspace/ui/components/separator";
import { Spinner } from "@workspace/ui/components/spinner";

const tabs = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "config", label: "Configuration", icon: Settings },
  { id: "providers", label: "Providers", icon: Cable },
  { id: "logs", label: "Logs", icon: Terminal },
  { id: "prompts", label: "Prompts", icon: FileText },
];

function DeploySubmitButton({ isDeploying }: { isDeploying: boolean }) {
  const { pending } = useFormStatus();
  const busy = pending || isDeploying;

  return (
    <Button size="sm" type="submit" disabled={busy}>
      {pending ? <Spinner data-icon="inline-start" /> : null}
      {busy ? "Deploying..." : "Deploy"}
    </Button>
  );
}

export function AgentDetailPage({
  agent,
  dashboardPath,
  teamSlug,
}: {
  agent: AgentListItem;
  dashboardPath: string;
  teamSlug: string;
}) {
  const isDeploying = agent.status === "deploying";

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          className="-ms-2 mb-4"
          render={<Link href={dashboardPath} />}
          nativeButton={false}
        >
          <ArrowLeft data-icon="inline-start" />
          All agents
        </Button>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-xl border bg-muted/50">
              <Bot className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold">{agent.name}</h1>
                <Badge
                  variant={agent.status === "active" ? "default" : "outline"}
                >
                  {agent.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {agent.slug}.crazp.dev
                {agent.lastRunAt
                  ? ` · Last run ${formatRelativeTime(agent.lastRunAt)}`
                  : " · Not deployed yet"}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>
              Pause
            </Button>
            <form action={deployAgent}>
              <input type="hidden" name="teamSlug" value={teamSlug} />
              <input type="hidden" name="agentId" value={agent.id} />
              <DeploySubmitButton isDeploying={isDeploying} />
            </form>
          </div>
        </div>
      </div>

      <div className="mb-8 flex gap-1 overflow-x-auto border-b pb-px">
        {tabs.map((tab, i) => (
          <button
            key={tab.id}
            type="button"
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm whitespace-nowrap transition-colors ${
              i === 0
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="size-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Overview</CardTitle>
              <CardDescription>
                Draft agent — deploy when you&apos;re ready to run it.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Model</p>
                <p className="mt-1 font-medium">{agent.model}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="mt-1 font-medium capitalize">{agent.status}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                {agent.instructions || "No instructions yet."}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Integrations</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                No integrations connected
              </p>
              <Separator className="my-4" />
              <Button variant="outline" size="sm" className="w-full" disabled>
                <Cable data-icon="inline-start" />
                Connect provider
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                disabled
              >
                <Settings data-icon="inline-start" />
                Edit configuration
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                disabled
              >
                <Terminal data-icon="inline-start" />
                View logs
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                disabled
              >
                <FileText data-icon="inline-start" />
                Edit system prompt
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
