import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  Bot,
  Cable,
  Cpu,
  FileText,
  Settings,
  Terminal,
} from "lucide-react";
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
import { getAgent } from "@/lib/mock-data";
import { formatRelativeTime } from "@/lib/format";

const tabs = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "config", label: "Configuration", icon: Settings },
  { id: "providers", label: "Providers", icon: Cable },
  { id: "logs", label: "Logs", icon: Terminal },
  { id: "prompts", label: "Prompts", icon: FileText },
];

export function AgentDetailPage({
  agentId,
  dashboardPath,
}: {
  agentId: string;
  dashboardPath: string;
}) {
  const agent = getAgent(agentId);
  if (!agent) notFound();

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 -ml-2"
          render={<Link href={dashboardPath} />}
          nativeButton={false}
        >
          <ArrowLeft className="h-4 w-4" />
          All agents
        </Button>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border bg-muted/50">
              <Bot className="h-6 w-6" />
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
                {agent.slug}.crazp.dev · Last run{" "}
                {formatRelativeTime(agent.lastRunAt)}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Pause
            </Button>
            <Button size="sm">Deploy</Button>
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
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Overview</CardTitle>
              <CardDescription>{agent.description}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">Model</p>
                <p className="mt-1 font-medium">{agent.model}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Provider</p>
                <p className="mt-1 font-medium">{agent.provider}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Runs today</p>
                <p className="mt-1 font-medium">{agent.runsToday}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                "Processed 24 support tickets",
                "Updated knowledge base embeddings",
                "Rate limit threshold at 78%",
              ].map((event) => (
                <div key={event} className="flex items-center gap-3 text-sm">
                  <Cpu className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span>{event}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    2h ago
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Integrations</CardTitle>
            </CardHeader>
            <CardContent>
              {agent.integrations.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {agent.integrations.map((integration) => (
                    <Badge key={integration} variant="secondary">
                      {integration}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No integrations connected
                </p>
              )}
              <Separator className="my-4" />
              <Button variant="outline" size="sm" className="w-full">
                <Cable className="h-4 w-4" />
                Connect provider
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
              >
                <Settings className="h-4 w-4" />
                Edit configuration
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
              >
                <Terminal className="h-4 w-4" />
                View logs
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
              >
                <FileText className="h-4 w-4" />
                Edit system prompt
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
