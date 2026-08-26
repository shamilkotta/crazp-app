"use client";

import type { AgentDetailData } from "@/lib/agents";
import { describeCron } from "@/lib/display";
import { ResourceList } from "@/components/board/agent-resources";

export { ToolsTab } from "@/components/board/tools-tab";
export { SkillsTab } from "@/components/board/skills-tab";
export { ChannelsTab } from "@/components/board/channels-tab";
export { ConnectionsTab } from "@/components/board/connections-tab";
export { SubagentsTab } from "@/components/board/subagents-tab";

type ResourceKind =
  | "tool"
  | "skill"
  | "channel"
  | "connection"
  | "subagent"
  | "scheduledTask"
  | "workflowTask";

export function AutomationsTab({
  agent,
  teamSlug,
  pending,
  onToggle,
  onDelete,
  onCreateSchedule,
  onCreateWorkflow,
}: {
  agent: AgentDetailData;
  teamSlug: string;
  pending: boolean;
  onToggle: (type: ResourceKind, id: string) => void;
  onDelete: (type: ResourceKind, id: string) => void;
  onCreateSchedule: (name: string) => void;
  onCreateWorkflow: (name: string) => void;
}) {
  return (
    <div className="flex flex-col gap-8">
      <ResourceList
        title="Schedules"
        blurb="Prompts that run on a clock."
        empty="Nothing is scheduled."
        catalogHref={`/${teamSlug}/catalog`}
        listingHref={(slug) => `/${teamSlug}/catalog/${slug}`}
        pending={pending}
        items={agent.scheduledTasks.map((item) => ({
          id: item.id,
          title: item.name,
          meta: `${describeCron(item.schedule)} · ${item.timezone}`,
          body: item.prompt,
          enabled: item.enabled,
        }))}
        onToggle={(id) => onToggle("scheduledTask", id)}
        onDelete={(id) => onDelete("scheduledTask", id)}
        onCreate={onCreateSchedule}
      />
      <ResourceList
        title="Workflows"
        blurb="Named sequences the agent follows when something happens."
        empty="No workflows yet."
        catalogHref={`/${teamSlug}/catalog`}
        listingHref={(slug) => `/${teamSlug}/catalog/${slug}`}
        pending={pending}
        items={agent.workflowTasks.map((item) => ({
          id: item.id,
          title: item.name,
          meta: item.trigger,
          body: item.stepsJson.map((step) => step.title).join(" → "),
          enabled: item.enabled,
        }))}
        onToggle={(id) => onToggle("workflowTask", id)}
        onDelete={(id) => onDelete("workflowTask", id)}
        onCreate={onCreateWorkflow}
      />
    </div>
  );
}
