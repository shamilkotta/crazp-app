"use client";

import { useEffect, useState, useTransition } from "react";

import {
  createAgentChannel,
  createAgentConnection,
  createAgentScheduledTask,
  createAgentSkill,
  createAgentSubagent,
  createAgentTool,
  createAgentWorkflowTask,
  deleteAgentResource,
  toggleAgentResource,
  updateAgentSetup,
} from "@/lib/actions/agents";
import type { AgentDetailData } from "@/lib/agents";
import { AgentOverview } from "@/components/board/agent-overview";
import {
  AutomationsTab,
  ChannelsTab,
  ConnectionsTab,
  SkillsTab,
  SubagentsTab,
  ToolsTab,
} from "@/components/board/agent-tabs";
import type { AgentTab } from "@/components/board/agent-types";
import {
  Field,
  PrimaryButton,
  inputClass,
  textareaClass,
} from "@/components/board/ui";
import { cn } from "@workspace/ui/lib/utils";

const tabs: Array<{ id: AgentTab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "setup", label: "Setup" },
  { id: "tools", label: "Tools" },
  { id: "skills", label: "Skills" },
  { id: "channels", label: "Channels" },
  { id: "connections", label: "Connections" },
  { id: "subagents", label: "Subagents" },
  { id: "automations", label: "Automations" },
];

function fields(
  teamSlug: string,
  agentId: string,
  extra?: Record<string, string>
) {
  const data = new FormData();
  data.set("teamSlug", teamSlug);
  data.set("agentId", agentId);
  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      data.set(key, value);
    }
  }
  return data;
}

export function AgentDetailPage({
  agent,
  teamSlug,
}: {
  agent: AgentDetailData;
  teamSlug: string;
}) {
  const [tab, setTab] = useState<AgentTab>("overview");
  const [name, setName] = useState(agent.name);
  const [instructions, setInstructions] = useState(agent.instructions);
  const [model, setModel] = useState(agent.model);
  const [maxSteps, setMaxSteps] = useState(String(agent.maxSteps));
  const [chatRecovery, setChatRecovery] = useState(agent.chatRecovery);
  const [extensions, setExtensions] = useState(agent.extensions);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setName(agent.name);
    setInstructions(agent.instructions);
    setModel(agent.model);
    setMaxSteps(String(agent.maxSteps));
    setChatRecovery(agent.chatRecovery);
    setExtensions(agent.extensions);
  }, [agent]);

  function mutate(
    action: (data: FormData) => Promise<void>,
    extra?: Record<string, string>
  ) {
    startTransition(() => action(fields(teamSlug, agent.id, extra)));
  }

  function saveSetup() {
    setSaved(false);
    const data = fields(teamSlug, agent.id, {
      name,
      instructions,
      model,
      maxSteps,
    });
    if (chatRecovery) data.set("chatRecovery", "on");
    if (extensions) data.set("extensions", "on");
    startTransition(async () => {
      await updateAgentSetup(data);
      setSaved(true);
    });
  }

  return (
    <div>
      <div className="scrollbar-none -mx-3 mb-5 flex gap-1 overflow-x-auto overflow-y-hidden border-b border-border px-3 sm:-mx-6 sm:px-6">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-[13px] whitespace-nowrap",
              tab === item.id
                ? "border-foreground font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <AgentOverview agent={agent} onOpen={setTab} />
      ) : null}

      {tab === "setup" ? (
        <div className="mx-auto flex max-w-2xl flex-col gap-4">
          <Field label="Name">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Instructions">
            <textarea
              value={instructions}
              onChange={(event) => setInstructions(event.target.value)}
              className={cn(textareaClass, "min-h-40")}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Model">
              <input
                value={model}
                onChange={(event) => setModel(event.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Max steps">
              <input
                value={maxSteps}
                onChange={(event) => setMaxSteps(event.target.value)}
                className={inputClass}
              />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-[13px]">
            <input
              type="checkbox"
              checked={chatRecovery}
              onChange={(event) => setChatRecovery(event.target.checked)}
            />
            Chat recovery
          </label>
          <label className="flex items-center gap-2 text-[13px]">
            <input
              type="checkbox"
              checked={extensions}
              onChange={(event) => setExtensions(event.target.checked)}
            />
            Extensions
          </label>
          <p className="text-[12px] text-muted-foreground">
            Changes apply on the next deploy. They are not live yet.
          </p>
          <div className="flex items-center gap-3">
            <PrimaryButton
              onClick={saveSetup}
              disabled={pending || !name.trim()}
            >
              {pending ? "Saving…" : "Save setup"}
            </PrimaryButton>
            {saved ? (
              <span className="text-[12px] text-muted-foreground">Saved</span>
            ) : null}
          </div>
        </div>
      ) : null}

      {tab === "tools" ? (
        <ToolsTab
          agent={agent}
          teamSlug={teamSlug}
          pending={pending}
          onToggle={(type, id) =>
            mutate(toggleAgentResource, { resourceType: type, resourceId: id })
          }
          onDelete={(type, id) =>
            mutate(deleteAgentResource, { resourceType: type, resourceId: id })
          }
          onCreate={(title) =>
            mutate(createAgentTool, {
              name: title,
              kind: "inline",
              description: "Custom tool",
            })
          }
        />
      ) : null}

      {tab === "skills" ? (
        <SkillsTab
          agent={agent}
          teamSlug={teamSlug}
          pending={pending}
          onToggle={(type, id) =>
            mutate(toggleAgentResource, { resourceType: type, resourceId: id })
          }
          onDelete={(type, id) =>
            mutate(deleteAgentResource, { resourceType: type, resourceId: id })
          }
          onCreate={(title) =>
            mutate(createAgentSkill, {
              name: title,
              description: "Custom skill",
            })
          }
        />
      ) : null}

      {tab === "channels" ? (
        <ChannelsTab
          agent={agent}
          teamSlug={teamSlug}
          pending={pending}
          onToggle={(type, id) =>
            mutate(toggleAgentResource, { resourceType: type, resourceId: id })
          }
          onDelete={(type, id) =>
            mutate(deleteAgentResource, { resourceType: type, resourceId: id })
          }
          onCreate={(title) =>
            mutate(createAgentChannel, {
              displayName: title,
              provider: "web",
            })
          }
        />
      ) : null}

      {tab === "connections" ? (
        <ConnectionsTab
          agent={agent}
          teamSlug={teamSlug}
          pending={pending}
          onToggle={(type, id) =>
            mutate(toggleAgentResource, { resourceType: type, resourceId: id })
          }
          onDelete={(type, id) =>
            mutate(deleteAgentResource, { resourceType: type, resourceId: id })
          }
          onCreate={(title) =>
            mutate(createAgentConnection, {
              displayName: title,
              provider: "custom",
              authType: "api_key",
            })
          }
        />
      ) : null}

      {tab === "subagents" ? (
        <SubagentsTab
          agent={agent}
          teamSlug={teamSlug}
          pending={pending}
          onToggle={(type, id) =>
            mutate(toggleAgentResource, { resourceType: type, resourceId: id })
          }
          onDelete={(type, id) =>
            mutate(deleteAgentResource, { resourceType: type, resourceId: id })
          }
          onCreate={(title) =>
            mutate(createAgentSubagent, {
              displayName: title,
              description: "Custom specialist",
              model: agent.model,
              maxSteps: String(agent.maxSteps),
            })
          }
        />
      ) : null}

      {tab === "automations" ? (
        <AutomationsTab
          agent={agent}
          teamSlug={teamSlug}
          pending={pending}
          onToggle={(type, id) =>
            mutate(toggleAgentResource, { resourceType: type, resourceId: id })
          }
          onDelete={(type, id) =>
            mutate(deleteAgentResource, { resourceType: type, resourceId: id })
          }
          onCreateSchedule={(title) =>
            mutate(createAgentScheduledTask, {
              name: title,
              schedule: "0 9 * * 1-5",
              prompt: title,
              timezone: "UTC",
            })
          }
          onCreateWorkflow={(title) =>
            mutate(createAgentWorkflowTask, {
              name: title,
              trigger: "manual",
              steps: title,
            })
          }
        />
      ) : null}
    </div>
  );
}
