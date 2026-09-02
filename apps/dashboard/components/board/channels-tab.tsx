"use client";

import { ChevronLeft, Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { AgentDetailData } from "@/lib/agents";
import {
  catalogChannelProvider,
  catalogSourceLabel,
  type CatalogField,
  type CatalogItem,
} from "@/lib/catalog";
import { useCatalogKind } from "@/components/catalog-provider";
import { formatCount } from "@/lib/display";
import {
  Empty,
  Field,
  GhostButton,
  PrimaryButton,
  ResourceCard,
  Surface,
  TextButton,
  inputClass,
} from "@/components/board/ui";
import { cn } from "@workspace/ui/lib/utils";

type ResourceKind =
  | "tool"
  | "skill"
  | "channel"
  | "connection"
  | "subagent"
  | "scheduledTask"
  | "workflowTask";

export type ChannelProvider = string;

export type ChannelDraft = {
  provider: ChannelProvider;
  displayName: string;
  config: Record<string, string>;
};

type AsideView =
  | { kind: "catalog" }
  | { kind: "preview"; preview: ChannelPreview }
  | { kind: "configure"; item: CatalogItem }
  | { kind: "create" };

type MobileSection = "added" | "catalog";

const GENERAL_FIELDS: CatalogField[] = [
  {
    key: "apiKey",
    label: "API key",
    type: "secret",
    required: false,
    help: "Bot token, access token, or other credential for this channel.",
  },
  {
    key: "webhookUrl",
    label: "Webhook URL",
    type: "url",
    required: false,
    placeholder: "https://…",
  },
  {
    key: "credentialLabel",
    label: "Credential label",
    type: "text",
    required: false,
    placeholder: "Production bot",
    help: "Optional label shown in the dashboard.",
  },
];

function providerFromCatalog(item: CatalogItem): ChannelProvider {
  return catalogChannelProvider(item);
}

function catalogItemForProvider(catalog: CatalogItem[], provider: string) {
  return catalog.find(
    (item) =>
      item.kind === "channel" && catalogChannelProvider(item) === provider
  );
}

export function ChannelsTab({
  agent,
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
  onCreate: (draft: ChannelDraft) => void;
}) {
  const catalog = useCatalogKind("channel");
  const [addedQuery, setAddedQuery] = useState("");
  const [catalogQuery, setCatalogQuery] = useState("");
  const [aside, setAside] = useState<AsideView>({ kind: "catalog" });
  const [mobileSection, setMobileSection] = useState<MobileSection>("added");

  const selected = aside.kind === "preview" ? aside.preview : null;
  const configuring = aside.kind === "configure" ? aside.item : null;
  const creating = aside.kind === "create";

  useEffect(() => {
    if (aside.kind === "catalog") return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setAside({ kind: "catalog" });
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [aside.kind]);

  useEffect(() => {
    if (aside.kind !== "preview") return;
    if (
      aside.preview.origin === "added" &&
      !agent.channels.some((channel) => channel.id === aside.preview.id)
    ) {
      setAside({ kind: "catalog" });
    }
  }, [agent.channels, aside]);

  const addedProviders = useMemo(
    () => new Set(agent.channels.map((channel) => channel.provider)),
    [agent.channels]
  );

  const addedChannels = useMemo(() => {
    const q = addedQuery.trim().toLowerCase();
    if (!q) return agent.channels;
    return agent.channels.filter((item) => {
      const label = String(
        (item.configJson as { credentialLabel?: string } | null)
          ?.credentialLabel ?? ""
      );
      return (
        item.displayName.toLowerCase().includes(q) ||
        item.provider.toLowerCase().includes(q) ||
        label.toLowerCase().includes(q)
      );
    });
  }, [agent.channels, addedQuery]);

  const catalogChannels = useMemo(() => {
    const q = catalogQuery.trim().toLowerCase();
    return catalog.filter((item) => {
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.tags.some((tag) => tag.includes(q))
      );
    });
  }, [catalog, catalogQuery]);

  function handleCreate(draft: ChannelDraft) {
    onCreate(draft);
    setAside({ kind: "catalog" });
  }

  function showMobileSection(section: MobileSection) {
    setMobileSection(section);
    setAside({ kind: "catalog" });
  }

  return (
    <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[minmax(0,1.65fr)_minmax(17rem,1fr)] lg:items-start lg:gap-0">
      <div
        className="flex items-center gap-1.5 lg:hidden"
        role="tablist"
        aria-label="Channels sections"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mobileSection === "added"}
          className={cn(
            "rounded-md px-2.5 py-1 text-[12px] whitespace-nowrap transition-colors",
            mobileSection === "added"
              ? "bg-muted font-medium text-foreground"
              : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
          )}
          onClick={() => showMobileSection("added")}
        >
          Channels
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mobileSection === "catalog"}
          className={cn(
            "rounded-md px-2.5 py-1 text-[12px] whitespace-nowrap transition-colors",
            mobileSection === "catalog"
              ? "bg-muted font-medium text-foreground"
              : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
          )}
          onClick={() => showMobileSection("catalog")}
        >
          Catalog
        </button>
      </div>

      <section
        className={cn(
          "flex-col lg:flex lg:pr-6",
          mobileSection === "added" ? "flex" : "hidden"
        )}
        role="tabpanel"
      >
        <div
          className={cn(
            "mb-4 flex flex-wrap items-start justify-between gap-3",
            creating && "hidden lg:flex"
          )}
        >
          <div>
            <h2 className="text-[15px] font-medium">Channels</h2>
            <p className="mt-1 max-w-xl text-[13px] text-muted-foreground">
              Where the agent listens. Add your keys on install — the agent then
              has an inbox.
            </p>
          </div>
          <PrimaryButton
            onClick={() => setAside({ kind: "create" })}
            disabled={pending}
          >
            <Plus className="size-3.5" />
            Create
          </PrimaryButton>
        </div>

        <div className={cn(creating ? "block" : "hidden", "lg:hidden")}>
          <ChannelCreateForm
            pending={pending}
            backLabel="Channels"
            catalog={catalog}
            onBack={() => setAside({ kind: "catalog" })}
            onCreate={handleCreate}
          />
        </div>

        <div className={cn(creating ? "hidden lg:block" : "block")}>
          <ChannelSearch
            value={addedQuery}
            onChange={setAddedQuery}
            placeholder="Search channels…"
          />

          {agent.channels.length === 0 ? (
            <Surface>
              <Empty
                title="No channels"
                body="Not listening anywhere yet. Slack or a web widget is the usual start — add one from the catalog."
              />
            </Surface>
          ) : addedChannels.length === 0 ? (
            <Surface>
              <Empty
                title="No matching channels"
                body="Try a different search, or clear the filter to see every channel on this agent."
              />
            </Surface>
          ) : (
            <div className="flex flex-col gap-3">
              {addedChannels.map((item) => {
                const isSelected =
                  selected?.id === item.id && selected.origin === "added";
                const label = String(
                  (item.configJson as { credentialLabel?: string } | null)
                    ?.credentialLabel ?? ""
                );
                return (
                  <ResourceCard
                    key={item.id}
                    muted={!item.enabled}
                    selected={isSelected}
                    selectLabel={`Open ${item.displayName}`}
                    bodyClassName="flex-col gap-2 sm:flex-row sm:items-start sm:gap-3"
                    onSelect={() => {
                      setMobileSection("catalog");
                      setAside({
                        kind: "preview",
                        preview: previewFromAdded(
                          item,
                          agent.deploymentUrl,
                          catalog
                        ),
                      });
                    }}
                    actions={
                      <>
                        <TextButton
                          disabled={pending}
                          onClick={() => onToggle("channel", item.id)}
                        >
                          {item.enabled ? "Enabled" : "Muted"}
                        </TextButton>
                        <TextButton
                          className="hover:text-destructive"
                          disabled={pending}
                          onClick={() => onDelete("channel", item.id)}
                        >
                          Remove
                        </TextButton>
                      </>
                    }
                  >
                    <p className="font-medium">{item.displayName}</p>
                    <p className="truncate text-[12px] text-muted-foreground">
                      {item.provider}
                      {label ? ` · ${label}` : ""}
                    </p>
                  </ResourceCard>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <aside
        className={cn(
          "flex-col lg:sticky lg:top-[53px] lg:flex lg:h-[calc(100dvh-3.8rem)] lg:overflow-hidden lg:border-l lg:pt-2 lg:pl-6",
          mobileSection === "catalog" ? "flex" : "hidden"
        )}
        role="tabpanel"
      >
        <div className="relative flex min-h-0 flex-1 flex-col">
          <div
            className={cn(
              "min-h-0 flex-1 flex-col",
              aside.kind === "catalog" ? "flex" : "hidden lg:flex"
            )}
          >
            <div className="mb-3 shrink-0">
              <h2 className="text-[15px] font-medium">Catalog</h2>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Channels from crazp and the community.
              </p>
            </div>

            <ChannelSearch
              value={catalogQuery}
              onChange={setCatalogQuery}
              placeholder="Search channels…"
            />

            {catalogChannels.length === 0 ? (
              <Surface className="min-h-0 flex-1 lg:overflow-y-auto">
                <Empty
                  title="No matching channels"
                  body="Try a different search, or browse for Slack, WhatsApp, or email."
                />
              </Surface>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col gap-3 lg:overflow-y-auto">
                {catalogChannels.map((item) => {
                  const provider = providerFromCatalog(item);
                  const added = addedProviders.has(provider);
                  const isSelected =
                    selected?.catalogItem?.id === item.id ||
                    configuring?.id === item.id;
                  return (
                    <ResourceCard
                      key={item.id}
                      selected={isSelected}
                      selectLabel={`Open ${item.name}`}
                      onSelect={() =>
                        setAside({
                          kind: "preview",
                          preview: previewFromCatalog(item),
                        })
                      }
                      actions={
                        added ? (
                          <span className="mt-0.5 text-[12px] text-muted-foreground">
                            Added
                          </span>
                        ) : (
                          <GhostButton
                            className="mt-0.5 h-7 px-2"
                            disabled={pending}
                            onClick={() =>
                              setAside({ kind: "configure", item })
                            }
                          >
                            Add
                          </GhostButton>
                        )
                      }
                    >
                      <p className="font-medium">{item.name}</p>
                      <p className="mt-0.5 line-clamp-2 text-[12px] text-muted-foreground">
                        {item.summary}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {item.source === "builtin"
                          ? catalogSourceLabel(item.source)
                          : item.author.handle}{" "}
                        · {formatCount(item.installs)}
                      </p>
                    </ResourceCard>
                  );
                })}
              </div>
            )}
          </div>

          {selected ? (
            <ChannelOverlay
              preview={selected}
              added={
                selected.catalogItem
                  ? addedProviders.has(
                      providerFromCatalog(selected.catalogItem)
                    )
                  : true
              }
              onBack={() => setAside({ kind: "catalog" })}
              onConfigure={
                selected.catalogItem
                  ? () =>
                      setAside({
                        kind: "configure",
                        item: selected.catalogItem as CatalogItem,
                      })
                  : undefined
              }
            />
          ) : null}

          {configuring ? (
            <ChannelConfigureForm
              item={configuring}
              pending={pending}
              onBack={() => setAside({ kind: "catalog" })}
              onCreate={handleCreate}
            />
          ) : null}

          {creating ? (
            <div className="hidden lg:contents">
              <ChannelCreateForm
                pending={pending}
                catalog={catalog}
                onBack={() => setAside({ kind: "catalog" })}
                onCreate={handleCreate}
              />
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

type ChannelPreview = {
  id: string;
  origin: "catalog" | "added";
  name: string;
  description: string;
  eyebrow: string;
  author?: string;
  version?: string;
  installs?: number;
  tags: string[];
  provider?: string;
  credentialLabel?: string;
  webhookUrl?: string;
  catalogItem: CatalogItem | null;
};

function previewFromCatalog(item: CatalogItem): ChannelPreview {
  return {
    id: item.id,
    origin: "catalog",
    name: item.name,
    description: item.description,
    eyebrow: `${item.kind} · ${catalogSourceLabel(item.source)}`,
    author: item.author.name,
    version: item.version,
    installs: item.installs,
    tags: item.tags,
    catalogItem: item,
  };
}

function previewFromAdded(
  channel: AgentDetailData["channels"][number],
  deploymentUrl: string | null,
  catalog: CatalogItem[]
): ChannelPreview {
  const match = catalogItemForProvider(catalog, channel.provider);
  const config =
    (channel.configJson as {
      credentialLabel?: string;
      _stem?: string;
    } | null) ?? {};
  const label = String(config.credentialLabel ?? "");
  const stem = config._stem || channel.provider;
  const webhookUrl =
    deploymentUrl && match?.hasWebhook
      ? `${deploymentUrl.replace(/\/$/, "")}/messengers/${stem}/webhook`
      : undefined;
  if (match) {
    return {
      ...previewFromCatalog(match),
      origin: "added",
      id: channel.id,
      credentialLabel: label || undefined,
      webhookUrl,
      provider: channel.provider,
    };
  }
  return {
    id: channel.id,
    origin: "added",
    name: channel.displayName,
    description: "Custom channel on this agent.",
    eyebrow: "channel · this agent",
    tags: [],
    provider: channel.provider,
    credentialLabel: label || undefined,
    webhookUrl,
    catalogItem: null,
  };
}

function ChannelSearch({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative mb-3 shrink-0">
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={cn(inputClass, "pl-8")}
      />
    </div>
  );
}

function ChannelFieldInputs({
  fields,
  values,
  onChange,
}: {
  fields: CatalogField[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {fields.map((field) => (
        <Field key={field.key} label={field.label} hint={field.help}>
          {field.type === "select" && field.options ? (
            <select
              value={values[field.key] ?? ""}
              onChange={(event) => onChange(field.key, event.target.value)}
              className={inputClass}
              required={field.required}
            >
              <option value="">Select…</option>
              {field.options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={field.type === "secret" ? "password" : "text"}
              value={values[field.key] ?? ""}
              onChange={(event) => onChange(field.key, event.target.value)}
              placeholder={field.placeholder}
              required={field.required}
              autoComplete={field.type === "secret" ? "off" : undefined}
              className={inputClass}
            />
          )}
        </Field>
      ))}
    </div>
  );
}

function ChannelConfigureForm({
  item,
  pending,
  onBack,
  onCreate,
}: {
  item: CatalogItem;
  pending: boolean;
  onBack: () => void;
  onCreate: (draft: ChannelDraft) => void;
}) {
  const fields = item.fields.length > 0 ? item.fields : GENERAL_FIELDS;
  const [displayName, setDisplayName] = useState(item.name);
  const [values, setValues] = useState<Record<string, string>>({});

  const requiredReady = fields
    .filter((field) => field.required)
    .every((field) => (values[field.key] ?? "").trim().length > 0);
  const canSubmit = displayName.trim().length > 0 && requiredReady;

  function submit() {
    if (!canSubmit || pending) return;
    const config: Record<string, string> = {};
    for (const [key, value] of Object.entries(values)) {
      const trimmed = value.trim();
      if (trimmed) config[key] = trimmed;
    }
    onCreate({
      provider: providerFromCatalog(item),
      displayName: displayName.trim(),
      config,
    });
  }

  return (
    <form
      className="flex flex-col bg-background lg:absolute lg:inset-0"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <div className="mb-3 shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-3.5" />
          Catalog
        </button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-3 lg:overflow-y-auto">
        <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          Configure {item.name}
        </p>
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          {item.description}
        </p>
        <Field label="Display name">
          <input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            className={inputClass}
          />
        </Field>
        <ChannelFieldInputs
          fields={fields}
          values={values}
          onChange={(key, value) =>
            setValues((prev) => ({ ...prev, [key]: value }))
          }
        />
        <p className="text-[12px] text-muted-foreground">
          Credentials are stored with this agent. Detailed validation comes
          later.
        </p>
      </div>
      <div className="mt-3 shrink-0">
        <PrimaryButton
          type="submit"
          className="w-full"
          disabled={!canSubmit || pending}
        >
          {pending ? "Adding…" : "Add channel"}
        </PrimaryButton>
      </div>
    </form>
  );
}

function ChannelCreateForm({
  pending,
  backLabel = "Catalog",
  catalog,
  onBack,
  onCreate,
}: {
  pending: boolean;
  backLabel?: string;
  catalog: CatalogItem[];
  onBack: () => void;
  onCreate: (draft: ChannelDraft) => void;
}) {
  const providers = catalog.map((item) => ({
    value: catalogChannelProvider(item),
    label: item.name,
  }));
  const [provider, setProvider] = useState<ChannelProvider>(
    providers[0]?.value ?? "telegram"
  );
  const [displayName, setDisplayName] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});

  const catalogItem = catalogItemForProvider(catalog, provider);
  const fields =
    catalogItem && catalogItem.fields.length > 0
      ? catalogItem.fields
      : GENERAL_FIELDS;

  const requiredReady = fields
    .filter((field) => field.required)
    .every((field) => (values[field.key] ?? "").trim().length > 0);
  const canSubmit = displayName.trim().length > 0 && requiredReady;

  function submit() {
    if (!canSubmit || pending) return;
    const config: Record<string, string> = {};
    for (const [key, value] of Object.entries(values)) {
      const trimmed = value.trim();
      if (trimmed) config[key] = trimmed;
    }
    onCreate({
      provider,
      displayName: displayName.trim(),
      config,
    });
  }

  return (
    <form
      className="flex flex-col bg-background lg:absolute lg:inset-0"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <div className="mb-3 shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-3.5" />
          {backLabel}
        </button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-3 lg:overflow-y-auto">
        <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          New channel
        </p>
        <Field label="Provider">
          <select
            value={provider}
            onChange={(event) => {
              setProvider(event.target.value as ChannelProvider);
              setValues({});
            }}
            className={inputClass}
          >
            {providers.map((entry) => (
              <option key={entry.value} value={entry.value}>
                {entry.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Display name">
          <input
            autoFocus
            value={displayName}
            maxLength={80}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Support Slack"
            className={inputClass}
          />
        </Field>
        <ChannelFieldInputs
          fields={fields}
          values={values}
          onChange={(key, value) =>
            setValues((prev) => ({ ...prev, [key]: value }))
          }
        />
      </div>
      <div className="mt-3 shrink-0">
        <PrimaryButton
          type="submit"
          className="w-full"
          disabled={!canSubmit || pending}
        >
          {pending ? "Creating…" : "Create"}
        </PrimaryButton>
      </div>
    </form>
  );
}

function ChannelOverlay({
  preview,
  added,
  onBack,
  onConfigure,
}: {
  preview: ChannelPreview;
  added: boolean;
  onBack: () => void;
  onConfigure?: () => void;
}) {
  return (
    <div className="flex flex-col bg-background lg:absolute lg:inset-0">
      <div className="mb-3 flex shrink-0 items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-3.5" />
          Catalog
        </button>
        {added || !onConfigure ? (
          <span className="text-[12px] text-muted-foreground">Added</span>
        ) : (
          <GhostButton className="h-7 px-2" onClick={onConfigure}>
            Add
          </GhostButton>
        )}
      </div>
      <div className="min-h-0 flex-1 lg:overflow-y-auto">
        <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          {preview.eyebrow}
        </p>
        <h3 className="mt-2 text-[16px] font-medium tracking-tight">
          {preview.name}
        </h3>
        <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
          {preview.description}
        </p>
        {preview.author ||
        preview.version ||
        preview.installs != null ||
        preview.provider ||
        preview.credentialLabel ||
        preview.webhookUrl ? (
          <dl className="mt-5 grid grid-cols-2 gap-3 text-[12px]">
            {preview.author ? (
              <div>
                <dt className="text-muted-foreground">Author</dt>
                <dd className="mt-1">{preview.author}</dd>
              </div>
            ) : null}
            {preview.version ? (
              <div>
                <dt className="text-muted-foreground">Version</dt>
                <dd className="mt-1">{preview.version}</dd>
              </div>
            ) : null}
            {preview.installs != null ? (
              <div>
                <dt className="text-muted-foreground">Installs</dt>
                <dd className="mt-1">{formatCount(preview.installs)}</dd>
              </div>
            ) : null}
            {preview.provider ? (
              <div>
                <dt className="text-muted-foreground">Provider</dt>
                <dd className="mt-1">{preview.provider}</dd>
              </div>
            ) : null}
            {preview.credentialLabel ? (
              <div>
                <dt className="text-muted-foreground">Credential</dt>
                <dd className="mt-1">{preview.credentialLabel}</dd>
              </div>
            ) : null}
            {preview.webhookUrl ? (
              <div className="col-span-2">
                <dt className="text-muted-foreground">Webhook URL</dt>
                <dd className="mt-1 font-mono text-[11px] break-all">
                  {preview.webhookUrl}
                </dd>
              </div>
            ) : null}
          </dl>
        ) : null}
        {preview.tags.length > 0 ? (
          <div className="mt-5 flex flex-wrap gap-1.5">
            {preview.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
