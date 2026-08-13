"use client";

import type { AgentDetailData } from "@/lib/agents";
import { Empty, Surface } from "@/components/board/ui";

export function RunsView({ agent }: { agent: AgentDetailData }) {
  return (
    <div>
      <p className="mb-4 max-w-xl text-[13px] text-muted-foreground">
        Every message, schedule and playground turn for {agent.name} will show
        up here.
      </p>
      <Surface>
        <Empty
          title="No runs yet"
          body="Run history is not stored yet. After the agent is live, inbound messages and scheduled jobs will list here."
        />
      </Surface>
    </div>
  );
}
