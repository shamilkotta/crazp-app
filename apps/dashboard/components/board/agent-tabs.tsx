"use client";

import type { AgentDetailData } from "@/lib/agents";
import { describeCron, shortModel } from "@/lib/display";
import { ResourceList } from "@/components/board/agent-resources";

export { SkillsTab } from "@/components/board/skills-tab";

type ResourceKind =
  | "tool"
  | "skill"
  | "channel"
  | "connection"
  | "subagent"
  | "scheduledTask"
  | "workflowTask";

export function ToolsTab({
  agent,
  teamSlug,
  pending,
  onToggle,
  onDelete,
  onCreate,
}: {
  agent: AgentDetailData;
  teamSlug: string;
  pending: boolean;
  onToggle: (type: ResourceKind, id: string) => void;
  onDelete: (type: ResourceKind, id: string) => void;
  onCreate: (name: string) => void;
}) {
  return (
    <ResourceList
      title="Tools"
      blurb="Things this agent can do. Install from the catalog or write your own."
      kind="tool"
      empty="No tools yet. Most agents start with web search or a ticket tool."
      catalogHref={`/${teamSlug}/catalog`}
      listingHref={(slug) => `/${teamSlug}/catalog/${slug}`}
      pending={pending}
      items={agent.tools.map((item) => ({
        id: item.id,
        title: item.name,
        meta: `${item.kind}${item.sourcePath ? ` · ${item.sourcePath}` : ""}`,
        body: item.description ?? "",
        enabled: item.enabled,
      }))}
      onToggle={(id) => onToggle("tool", id)}
      onDelete={(id) => onDelete("tool", id)}
      onCreate={onCreate}
    />
  );
}

export function ChannelsTab({
  agent,
  teamSlug,
  pending,
  onToggle,
  onDelete,
  onCreate,
}: {
  agent: AgentDetailData;
  teamSlug: string;
  pending: boolean;
  onToggle: (type: ResourceKind, id: string) => void;
  onDelete: (type: ResourceKind, id: string) => void;
  onCreate: (name: string) => void;
}) {
  return (
    <ResourceList
      title="Channels"
      blurb="Where the agent listens. Add your keys on install — the agent then has an inbox."
      kind="channel"
      empty="Not listening anywhere yet. Slack or a web widget is the usual start."
      catalogHref={`/${teamSlug}/catalog`}
      listingHref={(slug) => `/${teamSlug}/catalog/${slug}`}
      pending={pending}
      items={agent.channels.map((item) => ({
        id: item.id,
        title: item.displayName,
        meta: item.provider,
        body: String(
          (item.configJson as { credentialLabel?: string } | null)
            ?.credentialLabel ?? ""
        ),
        enabled: item.enabled,
      }))}
      onToggle={(id) => onToggle("channel", id)}
      onDelete={(id) => onDelete("channel", id)}
      onCreate={onCreate}
    />
  );
}

export function ConnectionsTab({
  agent,
  teamSlug,
  pending,
  onToggle,
  onDelete,
  onCreate,
}: {
  agent: AgentDetailData;
  teamSlug: string;
  pending: boolean;
  onToggle: (type: ResourceKind, id: string) => void;
  onDelete: (type: ResourceKind, id: string) => void;
  onCreate: (name: string) => void;
}) {
  return (
    <ResourceList
      title="Connections"
      blurb="Third-party accounts the agent acts on behalf of you."
      kind="connection"
      empty="No accounts connected. Zendesk or Stripe cover most support agents."
      catalogHref={`/${teamSlug}/catalog`}
      listingHref={(slug) => `/${teamSlug}/catalog/${slug}`}
      pending={pending}
      items={agent.connections.map((item) => ({
        id: item.id,
        title: item.displayName,
        meta: `${item.provider} · ${item.authType}`,
        body: item.scopes ?? "",
        enabled: item.enabled,
      }))}
      onToggle={(id) => onToggle("connection", id)}
      onDelete={(id) => onDelete("connection", id)}
      onCreate={onCreate}
    />
  );
}

export function SubagentsTab({
  agent,
  teamSlug,
  pending,
  onToggle,
  onDelete,
  onCreate,
}: {
  agent: AgentDetailData;
  teamSlug: string;
  pending: boolean;
  onToggle: (type: ResourceKind, id: string) => void;
  onDelete: (type: ResourceKind, id: string) => void;
  onCreate: (name: string) => void;
}) {
  return (
    <ResourceList
      title="Subagents"
      blurb="Specialists this agent can hand work to."
      kind="subagent"
      empty="No specialists yet. A researcher or billing investigator is a common first."
      catalogHref={`/${teamSlug}/catalog`}
      listingHref={(slug) => `/${teamSlug}/catalog/${slug}`}
      pending={pending}
      items={agent.subagents.map((item) => ({
        id: item.id,
        title: item.displayName,
        meta: `${item.key} · ${shortModel(item.model)}`,
        body: item.description,
        enabled: item.enabled,
      }))}
      onToggle={(id) => onToggle("subagent", id)}
      onDelete={(id) => onDelete("subagent", id)}
      onCreate={onCreate}
    />
  );
}

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
