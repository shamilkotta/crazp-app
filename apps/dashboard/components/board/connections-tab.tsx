"use client";

import { ChevronLeft, Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { AgentDetailData } from "@/lib/agents";
import {
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

export type ConnectionAuthType =
  | "api_key"
  | "oauth"
  | "webhook"
  | "service_account";

export type ConnectionDraft = {
  provider: string;
  displayName: string;
  authType: ConnectionAuthType;
  scopes?: string;
  credentialLabel?: string;
  config?: Record<string, string>;
};

type AsideView =
  | { kind: "catalog" }
  | { kind: "preview"; preview: ConnectionPreview }
  | { kind: "configure"; item: CatalogItem }
  | { kind: "create" };

type MobileSection = "added" | "catalog";

const AUTH_TYPES: Array<{ value: ConnectionAuthType; label: string }> = [
  { value: "api_key", label: "API key" },
  { value: "oauth", label: "OAuth" },
  { value: "webhook", label: "Webhook" },
  { value: "service_account", label: "Service account" },
];

const GENERAL_FIELDS: CatalogField[] = [
  {
    key: "credentialLabel",
    label: "Credential label",
    type: "text",
    required: false,
    placeholder: "Production",
    help: "Optional label shown in the dashboard.",
  },
  {
    key: "scopes",
    label: "Scopes",
    type: "text",
    required: false,
    placeholder: "read write",
    help: "Optional. Space-separated permissions.",
  },
];

function authTypeFromCatalog(item: CatalogItem): ConnectionAuthType {
  if (item.tags.includes("oauth")) return "oauth";
  if (item.tags.includes("webhook")) return "webhook";
  return "api_key";
}

export function ConnectionsTab({
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
  onCreate: (draft: ConnectionDraft) => void;
}) {
  const catalog = useCatalogKind("connection");
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
      !agent.connections.some(
        (connection) => connection.id === aside.preview.id
      )
    ) {
      setAside({ kind: "catalog" });
    }
  }, [agent.connections, aside]);

  const addedProviders = useMemo(
    () => new Set(agent.connections.map((connection) => connection.provider)),
    [agent.connections]
  );

  const addedConnections = useMemo(() => {
    const q = addedQuery.trim().toLowerCase();
    if (!q) return agent.connections;
    return agent.connections.filter((item) => {
      const label = String(
        (item.configJson as { credentialLabel?: string } | null)
          ?.credentialLabel ?? ""
      );
      return (
        item.displayName.toLowerCase().includes(q) ||
        item.provider.toLowerCase().includes(q) ||
        item.authType.toLowerCase().includes(q) ||
        (item.scopes?.toLowerCase().includes(q) ?? false) ||
        label.toLowerCase().includes(q)
      );
    });
  }, [agent.connections, addedQuery]);

  const catalogConnections = useMemo(() => {
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

  function handleCreate(draft: ConnectionDraft) {
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
        aria-label="Connections sections"
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
          Connections
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
            <h2 className="text-[15px] font-medium">Connections</h2>
            <p className="mt-1 max-w-xl text-[13px] text-muted-foreground">
              Third-party accounts the agent acts on behalf of you.
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
          <ConnectionCreateForm
            pending={pending}
            backLabel="Connections"
            onBack={() => setAside({ kind: "catalog" })}
            onCreate={handleCreate}
          />
        </div>

        <div className={cn(creating ? "hidden lg:block" : "block")}>
          <ConnectionSearch
            value={addedQuery}
            onChange={setAddedQuery}
            placeholder="Search connections…"
          />

          {agent.connections.length === 0 ? (
            <Surface>
              <Empty
                title="No connections"
                body="No accounts connected. Zendesk or Stripe cover most support agents — add one from the catalog."
              />
            </Surface>
          ) : addedConnections.length === 0 ? (
            <Surface>
              <Empty
                title="No matching connections"
                body="Try a different search, or clear the filter to see every connection on this agent."
              />
            </Surface>
          ) : (
            <div className="flex flex-col gap-3">
              {addedConnections.map((item) => {
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
                        preview: previewFromAdded(item, catalog),
                      });
                    }}
                    actions={
                      <>
                        <TextButton
                          disabled={pending}
                          onClick={() => onToggle("connection", item.id)}
                        >
                          {item.enabled ? "Enabled" : "Muted"}
                        </TextButton>
                        <TextButton
                          className="hover:text-destructive"
                          disabled={pending}
                          onClick={() => onDelete("connection", item.id)}
                        >
                          Remove
                        </TextButton>
                      </>
                    }
                  >
                    <p className="font-medium">{item.displayName}</p>
                    <p className="truncate text-[12px] text-muted-foreground">
                      {item.provider} · {item.authType}
                      {label ? ` · ${label}` : ""}
                    </p>
                    {item.scopes ? (
                      <p className="mt-1 line-clamp-2 text-[12px] text-muted-foreground">
                        {item.scopes}
                      </p>
                    ) : null}
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
                Connections from crazp and the community.
              </p>
            </div>

            <ConnectionSearch
              value={catalogQuery}
              onChange={setCatalogQuery}
              placeholder="Search connections…"
            />

            {catalogConnections.length === 0 ? (
              <Surface className="min-h-0 flex-1 lg:overflow-y-auto">
                <Empty
                  title="No matching connections"
                  body="Try a different search, or browse for Zendesk, Stripe, or GitHub."
                />
              </Surface>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col gap-3 lg:overflow-y-auto">
                {catalogConnections.map((item) => {
                  const added = addedProviders.has(item.slug);
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
            <ConnectionOverlay
              preview={selected}
              added={
                selected.catalogItem
                  ? addedProviders.has(selected.catalogItem.slug)
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
            <ConnectionConfigureForm
              item={configuring}
              pending={pending}
              onBack={() => setAside({ kind: "catalog" })}
              onCreate={handleCreate}
            />
          ) : null}

          {creating ? (
            <div className="hidden lg:contents">
              <ConnectionCreateForm
                pending={pending}
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

type ConnectionPreview = {
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
  authType?: string;
  scopes?: string | null;
  credentialLabel?: string;
  catalogItem: CatalogItem | null;
};

function previewFromCatalog(item: CatalogItem): ConnectionPreview {
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
  connection: AgentDetailData["connections"][number],
  catalog: CatalogItem[]
): ConnectionPreview {
  const match = catalog.find((item) => item.slug === connection.provider);
  const label = String(
    (connection.configJson as { credentialLabel?: string } | null)
      ?.credentialLabel ?? ""
  );
  if (match) {
    return {
      ...previewFromCatalog(match),
      origin: "added",
      id: connection.id,
      authType: connection.authType,
      scopes: connection.scopes,
      credentialLabel: label || undefined,
    };
  }
  return {
    id: connection.id,
    origin: "added",
    name: connection.displayName,
    description: "Custom connection on this agent.",
    eyebrow: "connection · this agent",
    tags: [],
    provider: connection.provider,
    authType: connection.authType,
    scopes: connection.scopes,
    credentialLabel: label || undefined,
    catalogItem: null,
  };
}

function ConnectionSearch({
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

function ConnectionFieldInputs({
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

function ConnectionConfigureForm({
  item,
  pending,
  onBack,
  onCreate,
}: {
  item: CatalogItem;
  pending: boolean;
  onBack: () => void;
  onCreate: (draft: ConnectionDraft) => void;
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
      provider: item.slug,
      displayName: displayName.trim(),
      authType: authTypeFromCatalog(item),
      scopes: config.scopes,
      credentialLabel: config.credentialLabel,
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
        <ConnectionFieldInputs
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
          {pending ? "Adding…" : "Add connection"}
        </PrimaryButton>
      </div>
    </form>
  );
}

function ConnectionCreateForm({
  pending,
  backLabel = "Catalog",
  onBack,
  onCreate,
}: {
  pending: boolean;
  backLabel?: string;
  onBack: () => void;
  onCreate: (draft: ConnectionDraft) => void;
}) {
  const [provider, setProvider] = useState("custom");
  const [displayName, setDisplayName] = useState("");
  const [authType, setAuthType] = useState<ConnectionAuthType>("api_key");
  const [values, setValues] = useState<Record<string, string>>({});

  const canSubmit = displayName.trim().length > 0 && provider.trim().length > 0;

  function submit() {
    if (!canSubmit || pending) return;
    const config: Record<string, string> = {};
    for (const [key, value] of Object.entries(values)) {
      const trimmed = value.trim();
      if (trimmed) config[key] = trimmed;
    }
    onCreate({
      provider: provider.trim(),
      displayName: displayName.trim(),
      authType,
      scopes: config.scopes,
      credentialLabel: config.credentialLabel,
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
          New connection
        </p>
        <Field label="Provider">
          <input
            value={provider}
            onChange={(event) => setProvider(event.target.value)}
            placeholder="zendesk"
            className={inputClass}
          />
        </Field>
        <Field label="Display name">
          <input
            autoFocus
            value={displayName}
            maxLength={80}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Northwind Zendesk"
            className={inputClass}
          />
        </Field>
        <Field label="Auth type">
          <select
            value={authType}
            onChange={(event) =>
              setAuthType(event.target.value as ConnectionAuthType)
            }
            className={inputClass}
          >
            {AUTH_TYPES.map((entry) => (
              <option key={entry.value} value={entry.value}>
                {entry.label}
              </option>
            ))}
          </select>
        </Field>
        <ConnectionFieldInputs
          fields={GENERAL_FIELDS}
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

function ConnectionOverlay({
  preview,
  added,
  onBack,
  onConfigure,
}: {
  preview: ConnectionPreview;
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
        preview.authType ||
        preview.scopes ||
        preview.credentialLabel ? (
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
            {preview.authType ? (
              <div>
                <dt className="text-muted-foreground">Auth</dt>
                <dd className="mt-1">{preview.authType}</dd>
              </div>
            ) : null}
            {preview.scopes ? (
              <div>
                <dt className="text-muted-foreground">Scopes</dt>
                <dd className="mt-1">{preview.scopes}</dd>
              </div>
            ) : null}
            {preview.credentialLabel ? (
              <div>
                <dt className="text-muted-foreground">Credential</dt>
                <dd className="mt-1">{preview.credentialLabel}</dd>
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
