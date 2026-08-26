"use client";

import { ChevronLeft, Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { AgentDetailData } from "@/lib/agents";
import {
  catalog,
  catalogSourceLabel,
  type CatalogField,
  type CatalogItem,
} from "@/lib/catalog";
import { formatCount, shortModel } from "@/lib/display";
import {
  Empty,
  Field,
  GhostButton,
  PrimaryButton,
  ResourceCard,
  Surface,
  TextButton,
  inputClass,
  textareaClass,
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

export type SubagentDraft = {
  name: string;
  description?: string;
  instructions?: string;
  model: string;
  maxSteps: number;
};

type AsideView =
  | { kind: "catalog" }
  | { kind: "preview"; preview: SubagentPreview }
  | { kind: "configure"; item: CatalogItem }
  | { kind: "create" };

type MobileSection = "added" | "catalog";

const DEFAULT_MODEL = "@cf/moonshotai/kimi-k2.6";

export function SubagentsTab({
  agent,
  pending,
  onToggle,
  onDelete,
  onCreate,
  onInstall,
}: {
  agent: AgentDetailData;
  teamSlug: string;
  pending: boolean;
  onToggle: (type: ResourceKind, id: string) => void;
  onDelete: (type: ResourceKind, id: string) => void;
  onCreate: (draft: SubagentDraft) => void;
  onInstall: (item: CatalogItem, draft?: Partial<SubagentDraft>) => void;
}) {
  const [addedQuery, setAddedQuery] = useState("");
  const [catalogQuery, setCatalogQuery] = useState("");
  const [aside, setAside] = useState<AsideView>({ kind: "catalog" });
  const [mobileSection, setMobileSection] = useState<MobileSection>("added");
  const [installingIds, setInstallingIds] = useState<ReadonlySet<string>>(
    () => new Set()
  );

  const selected = aside.kind === "preview" ? aside.preview : null;
  const configuring = aside.kind === "configure" ? aside.item : null;
  const creating = aside.kind === "create";

  useEffect(() => {
    if (!pending) setInstallingIds(new Set());
  }, [pending]);

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
      !agent.subagents.some((subagent) => subagent.id === aside.preview.id)
    ) {
      setAside({ kind: "catalog" });
    }
  }, [agent.subagents, aside]);

  const addedNames = useMemo(
    () =>
      new Set(agent.subagents.map((subagent) => subagent.name.toLowerCase())),
    [agent.subagents]
  );

  const addedSubagents = useMemo(() => {
    const q = addedQuery.trim().toLowerCase();
    if (!q) return agent.subagents;
    return agent.subagents.filter((item) => {
      return (
        item.name.toLowerCase().includes(q) ||
        item.slug.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.model.toLowerCase().includes(q)
      );
    });
  }, [agent.subagents, addedQuery]);

  const catalogSubagents = useMemo(() => {
    const q = catalogQuery.trim().toLowerCase();
    return catalog.filter((item) => {
      if (item.kind !== "subagent") return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.tags.some((tag) => tag.includes(q))
      );
    });
  }, [catalogQuery]);

  function markInstalling(id: string) {
    setInstallingIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }

  function handleInstall(item: CatalogItem, draft?: Partial<SubagentDraft>) {
    markInstalling(item.id);
    onInstall(item, draft);
    setAside({ kind: "catalog" });
  }

  function handleAdd(item: CatalogItem) {
    if (item.fields.length > 0) {
      setAside({ kind: "configure", item });
      return;
    }
    handleInstall(item);
  }

  function handleCreate(draft: SubagentDraft) {
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
        aria-label="Subagents sections"
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
          Subagents
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
            <h2 className="text-[15px] font-medium">Subagents</h2>
            <p className="mt-1 max-w-xl text-[13px] text-muted-foreground">
              Specialists this agent can hand work to.
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
          <SubagentCreateForm
            pending={pending}
            defaultModel={agent.model || DEFAULT_MODEL}
            defaultMaxSteps={agent.maxSteps}
            backLabel="Subagents"
            onBack={() => setAside({ kind: "catalog" })}
            onCreate={handleCreate}
          />
        </div>

        <div className={cn(creating ? "hidden lg:block" : "block")}>
          <SubagentSearch
            value={addedQuery}
            onChange={setAddedQuery}
            placeholder="Search subagents…"
          />

          {agent.subagents.length === 0 ? (
            <Surface>
              <Empty
                title="No subagents"
                body="No specialists yet. A researcher or billing investigator is a common first — add from the catalog."
              />
            </Surface>
          ) : addedSubagents.length === 0 ? (
            <Surface>
              <Empty
                title="No matching subagents"
                body="Try a different search, or clear the filter to see every subagent on this agent."
              />
            </Surface>
          ) : (
            <div className="flex flex-col gap-3">
              {addedSubagents.map((item) => {
                const isSelected =
                  selected?.name.toLowerCase() === item.name.toLowerCase();
                return (
                  <ResourceCard
                    key={item.id}
                    muted={!item.enabled}
                    selected={isSelected}
                    selectLabel={`Open ${item.name}`}
                    bodyClassName="flex-col gap-2 sm:flex-row sm:items-start sm:gap-3"
                    onSelect={() => {
                      setMobileSection("catalog");
                      setAside({
                        kind: "preview",
                        preview: previewFromAdded(item),
                      });
                    }}
                    actions={
                      <>
                        <TextButton
                          disabled={pending}
                          onClick={() => onToggle("subagent", item.id)}
                        >
                          {item.enabled ? "Enabled" : "Muted"}
                        </TextButton>
                        <TextButton
                          className="hover:text-destructive"
                          disabled={pending}
                          onClick={() => onDelete("subagent", item.id)}
                        >
                          Remove
                        </TextButton>
                      </>
                    }
                  >
                    <p className="font-medium">{item.name}</p>
                    <p className="truncate text-[12px] text-muted-foreground">
                      {item.slug} · {shortModel(item.model)}
                    </p>
                    {item.description ? (
                      <p className="mt-1 line-clamp-2 text-[12px] text-muted-foreground">
                        {item.description}
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
                Subagents from crazp and the community.
              </p>
            </div>

            <SubagentSearch
              value={catalogQuery}
              onChange={setCatalogQuery}
              placeholder="Search subagents…"
            />

            {catalogSubagents.length === 0 ? (
              <Surface className="min-h-0 flex-1 lg:overflow-y-auto">
                <Empty
                  title="No matching subagents"
                  body="Try a different search, or browse for research, billing, or translation."
                />
              </Surface>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col gap-3 lg:overflow-y-auto">
                {catalogSubagents.map((item) => {
                  const added = addedNames.has(item.name.toLowerCase());
                  const installing = installingIds.has(item.id);
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
                            disabled={installing || pending}
                            onClick={() => handleAdd(item)}
                          >
                            {installing ? "Adding…" : "Add"}
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
            <SubagentOverlay
              preview={selected}
              added={addedNames.has(selected.name.toLowerCase())}
              installing={
                selected.catalogItem
                  ? installingIds.has(selected.catalogItem.id)
                  : false
              }
              onBack={() => setAside({ kind: "catalog" })}
              onAdd={
                selected.catalogItem
                  ? () => handleAdd(selected.catalogItem as CatalogItem)
                  : undefined
              }
            />
          ) : null}

          {configuring ? (
            <SubagentConfigureForm
              item={configuring}
              pending={pending}
              defaultModel={agent.model || DEFAULT_MODEL}
              defaultMaxSteps={agent.maxSteps}
              onBack={() => setAside({ kind: "catalog" })}
              onInstall={(draft) => handleInstall(configuring, draft)}
            />
          ) : null}

          {creating ? (
            <div className="hidden lg:contents">
              <SubagentCreateForm
                pending={pending}
                defaultModel={agent.model || DEFAULT_MODEL}
                defaultMaxSteps={agent.maxSteps}
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

type SubagentPreview = {
  id: string;
  origin: "catalog" | "added";
  name: string;
  description: string;
  eyebrow: string;
  author?: string;
  version?: string;
  installs?: number;
  tags: string[];
  key?: string;
  model?: string;
  catalogItem: CatalogItem | null;
};

function previewFromCatalog(item: CatalogItem): SubagentPreview {
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
  subagent: AgentDetailData["subagents"][number]
): SubagentPreview {
  const match = catalog.find(
    (item) =>
      item.kind === "subagent" &&
      item.name.toLowerCase() === subagent.name.toLowerCase()
  );
  if (match) {
    return {
      ...previewFromCatalog(match),
      origin: "added",
      id: subagent.id,
      key: subagent.slug,
      model: subagent.model,
    };
  }
  return {
    id: subagent.id,
    origin: "added",
    name: subagent.name,
    description: subagent.description || "Custom specialist on this agent.",
    eyebrow: "subagent · this agent",
    tags: [],
    key: subagent.slug,
    model: subagent.model,
    catalogItem: null,
  };
}

function SubagentSearch({
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

function SubagentFieldInputs({
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

function SubagentConfigureForm({
  item,
  pending,
  defaultModel,
  defaultMaxSteps,
  onBack,
  onInstall,
}: {
  item: CatalogItem;
  pending: boolean;
  defaultModel: string;
  defaultMaxSteps: number;
  onBack: () => void;
  onInstall: (draft: Partial<SubagentDraft>) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});

  const requiredReady = item.fields
    .filter((field) => field.required)
    .every((field) => (values[field.key] ?? "").trim().length > 0);

  function submit() {
    if (!requiredReady || pending) return;
    onInstall({
      model: values.model?.trim() || defaultModel,
      maxSteps: defaultMaxSteps,
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
        <SubagentFieldInputs
          fields={item.fields}
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
          disabled={!requiredReady || pending}
        >
          {pending ? "Adding…" : "Add subagent"}
        </PrimaryButton>
      </div>
    </form>
  );
}

function SubagentCreateForm({
  pending,
  defaultModel,
  defaultMaxSteps,
  backLabel = "Catalog",
  onBack,
  onCreate,
}: {
  pending: boolean;
  defaultModel: string;
  defaultMaxSteps: number;
  backLabel?: string;
  onBack: () => void;
  onCreate: (draft: SubagentDraft) => void;
}) {
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [model, setModel] = useState(defaultModel);
  const [maxSteps, setMaxSteps] = useState(String(defaultMaxSteps));

  const canSubmit = displayName.trim().length > 0 && model.trim().length > 0;

  function submit() {
    if (!canSubmit || pending) return;
    const steps = Number.parseInt(maxSteps, 10);
    onCreate({
      name: displayName.trim(),
      description: description.trim() || undefined,
      instructions: instructions.trim() || undefined,
      model: model.trim(),
      maxSteps: Number.isFinite(steps) && steps > 0 ? steps : defaultMaxSteps,
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
          New subagent
        </p>
        <Field label="Display name">
          <input
            autoFocus
            value={displayName}
            maxLength={80}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Billing investigator"
            className={inputClass}
          />
        </Field>
        <Field label="Description" hint="Optional. Shown in the list.">
          <textarea
            value={description}
            maxLength={1000}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Reconstructs a billing timeline for a disputed charge."
            className={cn(textareaClass, "min-h-20")}
          />
        </Field>
        <Field
          label="Instructions"
          hint="Optional. System prompt for this specialist."
        >
          <textarea
            value={instructions}
            maxLength={20000}
            onChange={(event) => setInstructions(event.target.value)}
            placeholder="You investigate billing disputes. Stick to the facts…"
            className={cn(textareaClass, "min-h-28")}
          />
        </Field>
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

function SubagentOverlay({
  preview,
  added,
  installing,
  onBack,
  onAdd,
}: {
  preview: SubagentPreview;
  added: boolean;
  installing: boolean;
  onBack: () => void;
  onAdd?: () => void;
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
        {added || !onAdd ? (
          <span className="text-[12px] text-muted-foreground">Added</span>
        ) : (
          <GhostButton
            className="h-7 px-2"
            disabled={installing}
            onClick={onAdd}
          >
            {installing ? "Adding…" : "Add"}
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
        preview.key ||
        preview.model ? (
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
            {preview.key ? (
              <div>
                <dt className="text-muted-foreground">Key</dt>
                <dd className="mt-1 font-mono text-[11px]">{preview.key}</dd>
              </div>
            ) : null}
            {preview.model ? (
              <div>
                <dt className="text-muted-foreground">Model</dt>
                <dd className="mt-1">{shortModel(preview.model)}</dd>
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
