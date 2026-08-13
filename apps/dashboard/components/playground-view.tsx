"use client";

import { useState } from "react";

import type { AgentDetailData } from "@/lib/agents";
import { agentPublicUrl } from "@/lib/display";
import { Empty, Surface, textareaClass } from "@/components/board/ui";
import { cn } from "@workspace/ui/lib/utils";

export function PlaygroundView({ agent }: { agent: AgentDetailData }) {
  const [draft, setDraft] = useState("");
  const live = agent.status === "active" && Boolean(agent.deploymentUrl);

  return (
    <Surface className="mx-auto flex h-[min(640px,calc(100dvh-10rem))] max-w-2xl flex-col">
      <div className="flex-1 overflow-y-auto p-6">
        <Empty
          title={
            live ? "Ready when chat is wired" : "Playground is not live yet"
          }
          body={
            live
              ? `This is a private console for ${agent.name}. Chat against the worker is not connected in the dashboard yet — use the endpoint on Distribute.`
              : "Deploy the agent first. The playground talks to the live worker, not a mock."
          }
        />
      </div>
      <form
        className="flex gap-2 border-t border-border p-3"
        onSubmit={(event) => {
          event.preventDefault();
          setDraft("");
        }}
      >
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={`Message ${agent.name}…`}
          disabled
          className={cn(textareaClass, "min-h-11 resize-none")}
        />
      </form>
      {agent.deploymentUrl ? (
        <p className="px-3 pb-3 text-[11px] text-muted-foreground">
          Live at {agentPublicUrl(agent)}
        </p>
      ) : null}
    </Surface>
  );
}
