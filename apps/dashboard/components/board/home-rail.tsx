"use client";

import { CircleAlert } from "lucide-react";
import Link from "next/link";

import type { AgentListItem } from "@/lib/agents";
import { since } from "@/lib/display";
import { AgentMark, Empty, StatusDot, Surface } from "@/components/board/ui";

export function HomeRail({
  agents,
  teamSlug,
}: {
  agents: AgentListItem[];
  teamSlug: string;
}) {
  const errored = agents.filter((agent) => agent.status === "error");

  return (
    <aside className="order-2 flex w-full shrink-0 flex-col gap-4 lg:order-none lg:w-[300px]">
      <Surface className="p-5">
        <p className="font-medium">Usage</p>
        <p className="mt-1 text-[12px] text-muted-foreground">
          Runs, tokens and spend will show here once agents start handling
          traffic.
        </p>
      </Surface>
      <Surface>
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <p className="font-medium">Recent runs</p>
        </div>
        <Empty
          title="No runs yet"
          body="When an agent answers a message or finishes a scheduled job, it will land here."
        />
      </Surface>
      {errored.length > 0 ? (
        <AlertCard agents={errored} teamSlug={teamSlug} />
      ) : null}
    </aside>
  );
}

function AlertCard({
  agents,
  teamSlug,
}: {
  agents: AgentListItem[];
  teamSlug: string;
}) {
  return (
    <Surface className="border-red-500/30 p-5">
      <div className="flex items-start gap-2.5">
        <CircleAlert className="mt-0.5 size-4 shrink-0 text-red-600 dark:text-red-400" />
        <div className="min-w-0">
          <p className="font-medium">Needs attention</p>
          <ul className="mt-2 flex flex-col gap-2">
            {agents.map((agent) => (
              <li key={agent.id}>
                <Link
                  href={`/${teamSlug}/agents/${agent.id}`}
                  className="flex items-center gap-2 hover:text-foreground"
                >
                  <AgentMark name={agent.name} size={22} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate font-medium">{agent.name}</span>
                      <StatusDot status={agent.status} />
                    </span>
                    <span className="block text-[11px] text-muted-foreground">
                      Last run {since(agent.lastRunAt)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Surface>
  );
}
