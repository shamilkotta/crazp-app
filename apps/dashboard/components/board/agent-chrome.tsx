"use client";

import { Pause, Play, Rocket } from "lucide-react";
import { useTransition } from "react";

import { deployAgent, pauseOrResumeAgent } from "@/lib/actions/agents";
import type { AgentListItem } from "@/lib/agents";
import { ShellActions } from "@/components/board/shell";
import { GhostButton, PrimaryButton } from "@/components/board/ui";

export function AgentChrome({
  teamSlug,
  agent,
}: {
  teamSlug: string;
  agent: Pick<AgentListItem, "id" | "status">;
}) {
  const [pending, startTransition] = useTransition();
  const canPause = agent.status === "active" || agent.status === "paused";
  const deploying = agent.status === "deploying" || pending;

  function run(action: typeof deployAgent | typeof pauseOrResumeAgent) {
    const data = new FormData();
    data.set("teamSlug", teamSlug);
    data.set("agentId", agent.id);
    startTransition(() => action(data));
  }

  return (
    <ShellActions>
      {agent.status === "paused" ? (
        <GhostButton
          aria-label="Resume"
          className="px-2 sm:px-3"
          disabled={pending}
          onClick={() => run(pauseOrResumeAgent)}
        >
          <Play className="size-3.5" />
          <span className="hidden sm:inline">Resume</span>
        </GhostButton>
      ) : (
        <GhostButton
          aria-label="Pause"
          className="px-2 sm:px-3"
          disabled={!canPause || pending}
          onClick={() => run(pauseOrResumeAgent)}
        >
          <Pause className="size-3.5" />
          <span className="hidden sm:inline">Pause</span>
        </GhostButton>
      )}
      <PrimaryButton
        aria-label={agent.status === "deploying" ? "Deploying" : "Deploy"}
        className="px-2 sm:px-3"
        disabled={deploying}
        onClick={() => run(deployAgent)}
      >
        <Rocket className="size-3.5" />
        <span className="hidden sm:inline">
          {agent.status === "deploying" ? "Deploying…" : "Deploy"}
        </span>
      </PrimaryButton>
    </ShellActions>
  );
}
