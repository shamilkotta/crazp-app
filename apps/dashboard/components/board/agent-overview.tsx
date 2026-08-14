import { ExternalLink } from "lucide-react";
import Link from "next/link";

import type { AgentDetailData } from "@/lib/agents";
import {
  agentPublicHost,
  agentPublicUrl,
  capabilities,
  completeness,
  shortModel,
  since,
} from "@/lib/display";
import { agentTabHref, type AgentTab } from "@/components/board/agent-types";
import { StatusLabel, Surface } from "@/components/board/ui";

export function AgentOverview({
  agent,
  teamSlug,
}: {
  agent: AgentDetailData;
  teamSlug: string;
}) {
  const url = agentPublicUrl(agent);
  const ready = completeness(agent);
  const latest = agent.deployments[0];

  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <Surface className="p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <p className="text-[12px] text-muted-foreground">Production</p>
            <p className="mt-1 text-[16px] font-medium">{agent.name}</p>
            <a
              href={url}
              className="mt-1 inline-flex max-w-full items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground"
            >
              <span className="truncate">{agentPublicHost(agent)}</span>
              <ExternalLink className="size-3 shrink-0" />
            </a>
          </div>
          <StatusLabel status={agent.status} className="shrink-0" />
        </div>
        <dl className="mt-6 grid gap-4 text-[12px] sm:grid-cols-3">
          <div>
            <dt className="text-muted-foreground">Last deploy</dt>
            <dd className="mt-1">{latest ? since(latest.createdAt) : "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Last run</dt>
            <dd className="mt-1">{since(agent.lastRunAt)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Model</dt>
            <dd className="mt-1">{shortModel(agent.model)}</dd>
          </div>
        </dl>
        {latest?.errorMessage && agent.status === "error" ? (
          <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-[12px] text-red-600 dark:text-red-400">
            {latest.errorMessage}
          </p>
        ) : null}
      </Surface>

      <Surface className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <p className="font-medium">Configured</p>
          <span className="text-[12px] text-muted-foreground">{ready}%</span>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-foreground"
            style={{ width: `${ready}%` }}
          />
        </div>
        <ul className="mt-4 flex flex-col gap-2">
          {capabilities.map((cap) => {
            const count = agent.resourceCounts[cap.key];
            const tabId: AgentTab =
              cap.key === "scheduledTasks" || cap.key === "workflowTasks"
                ? "automations"
                : (cap.key as AgentTab);
            return (
              <li key={cap.key}>
                <Link
                  href={agentTabHref(teamSlug, agent.slug, tabId)}
                  className="flex w-full items-center justify-between text-left text-[12px] hover:text-foreground"
                >
                  <span
                    className={
                      count > 0 ? "text-foreground" : "text-muted-foreground"
                    }
                  >
                    {cap.label}
                  </span>
                  <span className="text-muted-foreground">
                    {count > 0 ? count : "Add"}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Surface>

      <Surface className="p-4 sm:p-6 lg:col-span-2">
        <p className="text-[12px] font-medium text-muted-foreground">
          Instructions
        </p>
        <p className="mt-2 max-w-[68ch] text-[13px] leading-relaxed text-muted-foreground">
          {agent.instructions || "No instructions yet."}
        </p>
        <Link
          href={agentTabHref(teamSlug, agent.slug, "setup")}
          className="mt-3 inline-flex items-center gap-1 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
        >
          Edit setup
        </Link>
      </Surface>
    </div>
  );
}
