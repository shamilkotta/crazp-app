"use client";

import Link from "next/link";
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
import type { CatalogItem } from "@/lib/catalog";
import { CatalogProvider } from "@/components/catalog-provider";
import { AgentOverview } from "@/components/board/agent-overview";
import {
  AutomationsTab,
  ChannelsTab,
  ConnectionsTab,
  SkillsTab,
  SubagentsTab,
  ToolsTab,
} from "@/components/board/agent-tabs";
import { ComingSoonTab } from "@/components/board/coming-soon-tab";
import { MarkdownEditor } from "@/components/board/markdown-editor";
import { agentTabHref, type AgentTab } from "@/components/board/agent-types";
import { Field, PrimaryButton, inputClass } from "@/components/board/ui";
import { cn } from "@workspace/ui/lib/utils";

/** Flip to true when each tab is ready to ship. */
const ENABLE_CONNECTIONS_TAB = false;
const ENABLE_SUBAGENTS_TAB = false;
const ENABLE_AUTOMATIONS_TAB = false;

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
  tab,
  catalog,
}: {
  agent: AgentDetailData;
  teamSlug: string;
  tab: AgentTab;
  catalog: CatalogItem[];
}) {
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
    <CatalogProvider items={catalog}>
      <div>
        <div className="sticky top-0 z-20 -mt-4 mb-5 bg-background pt-3">
          <div className="scrollbar-none flex gap-1 overflow-x-auto overflow-y-hidden border-b border-border">
            {tabs.map((item) => (
              <Link
                key={item.id}
                href={agentTabHref(teamSlug, agent.slug, item.id)}
                className={cn(
                  "-mb-px border-b-2 px-3 py-2 text-[13px] whitespace-nowrap",
                  tab === item.id
                    ? "border-foreground font-medium"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {tab === "overview" ? (
          <AgentOverview agent={agent} teamSlug={teamSlug} />
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
              <MarkdownEditor
                className="min-h-72"
                value={instructions}
                onChange={setInstructions}
                placeholder="What the agent should do, how it should behave, and what to avoid…"
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
              mutate(toggleAgentResource, {
                resourceType: type,
                resourceId: id,
              })
            }
            onDelete={(type, id) =>
              mutate(deleteAgentResource, {
                resourceType: type,
                resourceId: id,
              })
            }
            onCreate={(draft) =>
              mutate(createAgentTool, {
                name: draft.name,
                kind: draft.kind,
                description: draft.description ?? "",
                sourcePath: draft.sourcePath ?? "",
                configPath: draft.configPath ?? "",
              })
            }
            onInstall={(item) =>
              mutate(createAgentTool, {
                name: item.name,
                kind: "builtin",
                description: item.summary,
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
              mutate(toggleAgentResource, {
                resourceType: type,
                resourceId: id,
              })
            }
            onDelete={(type, id) =>
              mutate(deleteAgentResource, {
                resourceType: type,
                resourceId: id,
              })
            }
            onCreate={(draft) => {
              const data = fields(teamSlug, agent.id, {
                name: draft.name,
                description: draft.description,
                body: draft.body,
                allowedTools: draft.allowedTools ?? "",
                license: draft.license ?? "",
                compatibility: draft.compatibility ?? "",
              });
              draft.resources?.forEach((resource, index) => {
                data.set(`resourceKind:${index}`, resource.kind);
                data.set(`resourcePath:${index}`, resource.path);
                if (resource.mimeType) {
                  data.set(`resourceMimeType:${index}`, resource.mimeType);
                }
                data.set(`resourceFile:${index}`, resource.file);
              });
              startTransition(() => createAgentSkill(data));
            }}
            onInstall={(item) =>
              mutate(createAgentSkill, {
                name: item.name,
                description: item.summary,
                body: item.description,
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
              mutate(toggleAgentResource, {
                resourceType: type,
                resourceId: id,
              })
            }
            onDelete={(type, id) =>
              mutate(deleteAgentResource, {
                resourceType: type,
                resourceId: id,
              })
            }
            onCreate={(draft) =>
              mutate(createAgentChannel, {
                displayName: draft.displayName,
                provider: draft.provider,
                credentialLabel:
                  draft.config.credentialLabel ||
                  draft.config.apiKey ||
                  draft.config.botToken ||
                  draft.config.accessToken ||
                  "",
                webhookUrl: draft.config.webhookUrl || "",
                configJson: JSON.stringify(draft.config),
              })
            }
          />
        ) : null}

        {tab === "connections" ? (
          ENABLE_CONNECTIONS_TAB ? (
            <ConnectionsTab
              agent={agent}
              teamSlug={teamSlug}
              pending={pending}
              onToggle={(type, id) =>
                mutate(toggleAgentResource, {
                  resourceType: type,
                  resourceId: id,
                })
              }
              onDelete={(type, id) =>
                mutate(deleteAgentResource, {
                  resourceType: type,
                  resourceId: id,
                })
              }
              onCreate={(draft) =>
                mutate(createAgentConnection, {
                  displayName: draft.displayName,
                  provider: draft.provider,
                  authType: draft.authType,
                  scopes: draft.scopes ?? draft.config?.scopes ?? "",
                  credentialLabel:
                    draft.credentialLabel ??
                    draft.config?.credentialLabel ??
                    "",
                })
              }
            />
          ) : (
            <ComingSoonTab
              title="Connections"
              body="Wire up GitHub, databases, support desks, and other services so your agent can read and act on real data."
            />
          )
        ) : null}

        {tab === "subagents" ? (
          ENABLE_SUBAGENTS_TAB ? (
            <SubagentsTab
              agent={agent}
              teamSlug={teamSlug}
              pending={pending}
              onToggle={(type, id) =>
                mutate(toggleAgentResource, {
                  resourceType: type,
                  resourceId: id,
                })
              }
              onDelete={(type, id) =>
                mutate(deleteAgentResource, {
                  resourceType: type,
                  resourceId: id,
                })
              }
              onCreate={(draft) =>
                mutate(createAgentSubagent, {
                  name: draft.name,
                  description: draft.description ?? "",
                  instructions: draft.instructions ?? "",
                  model: draft.model,
                  maxSteps: String(draft.maxSteps),
                })
              }
              onInstall={(item, draft) =>
                mutate(createAgentSubagent, {
                  name: item.name,
                  description: item.summary,
                  instructions: item.description,
                  model: draft?.model ?? agent.model,
                  maxSteps: String(draft?.maxSteps ?? agent.maxSteps),
                })
              }
            />
          ) : (
            <ComingSoonTab
              title="Subagents"
              body="Spin up focused agents your main agent can delegate to — each with its own instructions, model, and tools."
            />
          )
        ) : null}

        {tab === "automations" ? (
          ENABLE_AUTOMATIONS_TAB ? (
            <AutomationsTab
              agent={agent}
              teamSlug={teamSlug}
              pending={pending}
              onToggle={(type, id) =>
                mutate(toggleAgentResource, {
                  resourceType: type,
                  resourceId: id,
                })
              }
              onDelete={(type, id) =>
                mutate(deleteAgentResource, {
                  resourceType: type,
                  resourceId: id,
                })
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
          ) : (
            <ComingSoonTab
              title="Automations"
              body="Schedule recurring prompts and build workflows that run your agent on a clock or when something happens."
            />
          )
        ) : null}
      </div>
    </CatalogProvider>
  );
}
