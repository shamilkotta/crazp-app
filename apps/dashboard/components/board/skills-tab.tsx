"use client";

import { ChevronLeft, Plus, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { AgentDetailData } from "@/lib/agents";
import { catalog, catalogSourceLabel, type CatalogItem } from "@/lib/catalog";
import { formatCount } from "@/lib/display";
import {
  MAX_SKILL_RESOURCE_BYTES,
  MAX_SKILL_RESOURCES,
  type SkillResourceKind,
} from "@/lib/skill-resources";
import { MarkdownEditor } from "@/components/board/markdown-editor";
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

export type SkillResourceDraft = {
  kind: SkillResourceKind;
  path: string;
  mimeType?: string;
  size: number;
  file: File;
};

export type SkillDraft = {
  name: string;
  description: string;
  body: string;
  allowedTools?: string;
  license?: string;
  compatibility?: string;
  resources?: SkillResourceDraft[];
};

type AsideView =
  | { kind: "catalog" }
  | { kind: "preview"; preview: SkillPreview }
  | { kind: "create" };

type MobileSection = "added" | "catalog";

export function SkillsTab({
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
  onCreate: (draft: SkillDraft) => void;
  onInstall: (item: CatalogItem) => void;
}) {
  const [addedQuery, setAddedQuery] = useState("");
  const [catalogQuery, setCatalogQuery] = useState("");
  const [aside, setAside] = useState<AsideView>({ kind: "catalog" });
  const [mobileSection, setMobileSection] = useState<MobileSection>("added");
  const [installingIds, setInstallingIds] = useState<ReadonlySet<string>>(
    () => new Set()
  );

  const selected = aside.kind === "preview" ? aside.preview : null;
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
      !agent.skills.some((skill) => skill.id === aside.preview.id)
    ) {
      setAside({ kind: "catalog" });
    }
  }, [agent.skills, aside]);

  const addedNames = useMemo(
    () => new Set(agent.skills.map((skill) => skill.name.toLowerCase())),
    [agent.skills]
  );

  const addedSkills = useMemo(() => {
    const q = addedQuery.trim().toLowerCase();
    if (!q) return agent.skills;
    return agent.skills.filter((item) => {
      return (
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        (item.allowedTools?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [agent.skills, addedQuery]);

  const catalogSkills = useMemo(() => {
    const q = catalogQuery.trim().toLowerCase();
    return catalog.filter((item) => {
      if (item.kind !== "skill") return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.tags.some((tag) => tag.includes(q))
      );
    });
  }, [catalogQuery]);

  function handleInstall(item: CatalogItem) {
    setInstallingIds((prev) => {
      const next = new Set(prev);
      next.add(item.id);
      return next;
    });
    onInstall(item);
  }

  function handleCreate(draft: SkillDraft) {
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
        aria-label="Skills sections"
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
          Skills
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
            <h2 className="text-[15px] font-medium">Skills</h2>
            <p className="mt-1 max-w-xl text-[13px] text-muted-foreground">
              Written guidance the agent loads when it needs to think a certain
              way.
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
          <SkillCreateForm
            pending={pending}
            backLabel="Skills"
            onBack={() => setAside({ kind: "catalog" })}
            onCreate={handleCreate}
          />
        </div>

        <div className={cn(creating ? "hidden lg:block" : "block")}>
          <SkillSearch
            value={addedQuery}
            onChange={setAddedQuery}
            placeholder="Search skills…"
          />

          {agent.skills.length === 0 ? (
            <Surface>
              <Empty
                title="No skills"
                body="No skills yet. A tone-of-voice skill is usually the first one — create one, or add from the catalog."
              />
            </Surface>
          ) : addedSkills.length === 0 ? (
            <Surface>
              <Empty
                title="No matching skills"
                body="Try a different search, or clear the filter to see every skill on this agent."
              />
            </Surface>
          ) : (
            <div className="flex flex-col gap-3">
              {addedSkills.map((item) => {
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
                          onClick={() => onToggle("skill", item.id)}
                        >
                          {item.enabled ? "Enabled" : "Muted"}
                        </TextButton>
                        <TextButton
                          className="hover:text-destructive"
                          disabled={pending}
                          onClick={() => onDelete("skill", item.id)}
                        >
                          Remove
                        </TextButton>
                      </>
                    }
                  >
                    <p className="font-medium">{item.name}</p>
                    <p className="truncate text-[12px] text-muted-foreground">
                      {item.allowedTools ?? "all tools"}
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
                Skills from crazp and the community.
              </p>
            </div>

            <SkillSearch
              value={catalogQuery}
              onChange={setCatalogQuery}
              placeholder="Search skills…"
            />

            {catalogSkills.length === 0 ? (
              <Surface className="min-h-0 flex-1 lg:overflow-y-auto">
                <Empty
                  title="No matching skills"
                  body="Try a different search, or browse for triage, tone, or refund."
                />
              </Surface>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col gap-3 lg:overflow-y-auto">
                {catalogSkills.map((item) => {
                  const added = addedNames.has(item.name.toLowerCase());
                  const installing = installingIds.has(item.id);
                  const isSelected = selected?.catalogItem?.id === item.id;
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
                            disabled={installing}
                            onClick={() => handleInstall(item)}
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
            <SkillOverlay
              preview={selected}
              added={addedNames.has(selected.name.toLowerCase())}
              installing={
                selected.catalogItem
                  ? installingIds.has(selected.catalogItem.id)
                  : false
              }
              onBack={() => setAside({ kind: "catalog" })}
              onInstall={
                selected.catalogItem
                  ? () => handleInstall(selected.catalogItem as CatalogItem)
                  : undefined
              }
            />
          ) : null}

          {creating ? (
            <div className="hidden lg:contents">
              <SkillCreateForm
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

type SkillPreview = {
  id: string;
  origin: "catalog" | "added";
  name: string;
  description: string;
  body?: string;
  eyebrow: string;
  author?: string;
  version?: string;
  installs?: number;
  tags: string[];
  allowedTools?: string | null;
  license?: string | null;
  compatibility?: string | null;
  enabled?: boolean;
  metadataJson?: Record<string, unknown> | null;
  resources: Array<{
    id: string;
    path: string;
    kind: string;
    mimeType: string | null;
    size: number;
  }>;
  catalogItem: CatalogItem | null;
};

function previewFromCatalog(item: CatalogItem): SkillPreview {
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
    resources: [],
    catalogItem: item,
  };
}

function previewFromAdded(
  skill: AgentDetailData["skills"][number]
): SkillPreview {
  const match = catalog.find(
    (item) =>
      item.kind === "skill" &&
      item.name.toLowerCase() === skill.name.toLowerCase()
  );
  return {
    id: skill.id,
    origin: "added",
    name: skill.name,
    description: skill.description,
    body: skill.body,
    eyebrow: match
      ? `skill · ${catalogSourceLabel(match.source)}`
      : "skill · this agent",
    author: match?.author.name,
    version: match?.version,
    installs: match?.installs,
    tags: match?.tags ?? [],
    allowedTools: skill.allowedTools,
    license: skill.license,
    compatibility: skill.compatibility,
    enabled: skill.enabled,
    metadataJson: skill.metadataJson,
    resources: skill.resources.map((resource) => ({
      id: resource.id,
      path: resource.path,
      kind: resource.kind,
      mimeType: resource.mimeType,
      size: resource.size,
    })),
    catalogItem: match ?? null,
  };
}

function SkillSearch({
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

type SkillResourceItem = SkillResourceDraft & { id: string };

const RESOURCE_GROUPS: Array<{
  kind: SkillResourceKind;
  folder: "scripts" | "references" | "assets";
  label: string;
  hint: string;
  accept: string;
}> = [
  {
    kind: "script",
    folder: "scripts",
    label: "Scripts",
    hint: "Optional. Executable code the agent can run.",
    accept: ".py,.js,.ts,.mjs,.cjs,.sh,.bash,.rb,.pl,.php",
  },
  {
    kind: "reference",
    folder: "references",
    label: "References",
    hint: "Optional. Docs the agent reads on demand.",
    accept: ".md,.txt,.json,.yaml,.yml,.csv",
  },
  {
    kind: "asset",
    folder: "assets",
    label: "Assets",
    hint: "Optional. Templates, images, and other files.",
    accept: "",
  },
];

// TODO: check how path are cofigured, revisit this
function safeFileName(name: string) {
  const base = name.split(/[/\\]/).pop() ?? "file";
  return base.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/^\.+/g, "") || "file";
}

function resourcePath(folder: string, filename: string, used: Set<string>) {
  const original = `${folder}/${safeFileName(filename)}`;
  if (!used.has(original)) return original;
  const dot = original.lastIndexOf(".");
  const stem = dot > folder.length + 1 ? original.slice(0, dot) : original;
  const ext = dot > folder.length + 1 ? original.slice(dot) : "";
  let index = 2;
  let next = `${stem}-${index}${ext}`;
  while (used.has(next)) {
    index += 1;
    next = `${stem}-${index}${ext}`;
  }
  return next;
}

function formatBytes(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function SkillResourceFields({
  value,
  onChange,
}: {
  value: SkillResourceItem[];
  onChange: (next: SkillResourceItem[]) => void;
}) {
  const [error, setError] = useState<string | null>(null);

  function addFiles(
    kind: SkillResourceKind,
    folder: string,
    files: FileList | null
  ) {
    if (!files || files.length === 0) return;
    setError(null);
    const used = new Set(value.map((item) => item.path));
    const next: SkillResourceItem[] = [];

    for (const file of Array.from(files)) {
      if (file.size > MAX_SKILL_RESOURCE_BYTES) {
        setError(`${file.name} is larger than 512 KB.`);
        continue;
      }
      if (value.length + next.length >= MAX_SKILL_RESOURCES) {
        setError(`You can attach up to ${MAX_SKILL_RESOURCES} files.`);
        break;
      }
      const path = resourcePath(folder, file.name, used);
      used.add(path);
      next.push({
        id: crypto.randomUUID(),
        kind,
        path,
        mimeType: file.type || undefined,
        size: file.size,
        file,
      });
    }

    if (next.length > 0) onChange([...value, ...next]);
  }

  return (
    <div className="flex flex-col gap-3">
      {RESOURCE_GROUPS.map((group) => {
        const items = value.filter((item) => item.kind === group.kind);
        return (
          <div key={group.kind}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[12px] font-medium text-muted-foreground">
                {group.label}
              </span>
              <label className="inline-flex">
                <input
                  type="file"
                  multiple
                  accept={group.accept || undefined}
                  className="sr-only"
                  onChange={(event) => {
                    addFiles(group.kind, group.folder, event.target.files);
                    event.target.value = "";
                  }}
                />
                <span className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-lg border border-border px-2 text-[12px] font-medium hover:bg-muted">
                  <Plus className="size-3" />
                  Add
                </span>
              </label>
            </div>
            <p className="mt-1 text-[12px] text-muted-foreground">
              {group.hint}
            </p>
            {items.length > 0 ? (
              <ul className="mt-2 flex flex-col gap-1.5">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-2 rounded-lg border border-border px-2.5 py-1.5"
                  >
                    <span className="min-w-0 flex-1 truncate font-mono text-[11px]">
                      {item.path}
                    </span>
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {formatBytes(item.size)}
                    </span>
                    <button
                      type="button"
                      aria-label={`Remove ${item.path}`}
                      className="shrink-0 text-muted-foreground hover:text-foreground"
                      onClick={() =>
                        onChange(value.filter((entry) => entry.id !== item.id))
                      }
                    >
                      <X className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        );
      })}
      {error ? <p className="text-[12px] text-destructive">{error}</p> : null}
    </div>
  );
}

function SkillCreateForm({
  pending,
  backLabel = "Catalog",
  onBack,
  onCreate,
}: {
  pending: boolean;
  backLabel?: string;
  onBack: () => void;
  onCreate: (draft: SkillDraft) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [body, setBody] = useState("");
  const [allowedTools, setAllowedTools] = useState("");
  const [license, setLicense] = useState("");
  const [compatibility, setCompatibility] = useState("");
  const [resources, setResources] = useState<SkillResourceItem[]>([]);

  const canSubmit = name.trim().length > 0 && description.trim().length > 0;

  function submit() {
    if (!canSubmit || pending) return;
    onCreate({
      name: name.trim(),
      description: description.trim(),
      body: body.trim(),
      allowedTools: allowedTools.trim() || undefined,
      license: license.trim() || undefined,
      compatibility: compatibility.trim() || undefined,
      resources: resources.map((item) => ({
        kind: item.kind,
        path: item.path,
        mimeType: item.mimeType,
        size: item.size,
        file: item.file,
      })),
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
          New skill
        </p>
        <Field
          label="Name"
          hint="Lowercase letters, numbers, and hyphens. Agents use this to identify the skill."
        >
          <input
            autoFocus
            value={name}
            maxLength={64}
            onChange={(event) => setName(event.target.value)}
            placeholder="refund-policy"
            className={inputClass}
          />
        </Field>
        <Field
          label="Description"
          hint="What it does and when to use it. Include keywords that help the agent pick it up."
        >
          <textarea
            value={description}
            maxLength={1024}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Extract PDF text, fill forms, merge files. Use when handling PDFs."
            className={cn(textareaClass, "min-h-20")}
          />
        </Field>
        <div>
          <span className="text-[12px] font-medium text-muted-foreground">
            Skill
          </span>
          <MarkdownEditor
            className="mt-1.5 min-h-72"
            value={body}
            onChange={setBody}
            placeholder="Instructions the agent follows once this skill is activated…"
          />
          <span className="mt-1.5 block text-[12px] text-muted-foreground">
            Markdown body of SKILL.md. Point at bundled files with paths like
            scripts/extract.py or references/policy.md.
          </span>
        </div>
        <SkillResourceFields value={resources} onChange={setResources} />
        <Field
          label="Allowed tools"
          hint="Optional. Space-separated tools this skill may use."
        >
          <input
            value={allowedTools}
            onChange={(event) => setAllowedTools(event.target.value)}
            placeholder="Read Write Bash"
            className={inputClass}
          />
        </Field>
        <Field label="License" hint="Optional.">
          <input
            value={license}
            onChange={(event) => setLicense(event.target.value)}
            placeholder="MIT"
            className={inputClass}
          />
        </Field>
        <Field
          label="Compatibility"
          hint="Optional. Environment or product requirements."
        >
          <input
            value={compatibility}
            onChange={(event) => setCompatibility(event.target.value)}
            placeholder="Requires network access"
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

function SkillOverlay({
  preview,
  added,
  installing,
  onBack,
  onInstall,
}: {
  preview: SkillPreview;
  added: boolean;
  installing: boolean;
  onBack: () => void;
  onInstall?: () => void;
}) {
  const metaEntries = [
    preview.author ? { label: "Author", value: preview.author } : null,
    preview.version ? { label: "Version", value: preview.version } : null,
    preview.installs != null
      ? { label: "Installs", value: formatCount(preview.installs) }
      : null,
    preview.allowedTools
      ? { label: "Tools", value: preview.allowedTools }
      : null,
    preview.license ? { label: "License", value: preview.license } : null,
    preview.compatibility
      ? { label: "Compatibility", value: preview.compatibility }
      : null,
    preview.enabled != null
      ? { label: "Status", value: preview.enabled ? "Enabled" : "Muted" }
      : null,
  ].filter((entry): entry is { label: string; value: string } => entry != null);

  const metadataEntries = preview.metadataJson
    ? Object.entries(preview.metadataJson).filter(
        ([, value]) => value != null && value !== ""
      )
    : [];

  const resourcesByKind = RESOURCE_GROUPS.map((group) => ({
    ...group,
    items: preview.resources.filter((item) => item.kind === group.kind),
  })).filter((group) => group.items.length > 0);

  const otherResources = preview.resources.filter(
    (item) => !RESOURCE_GROUPS.some((group) => group.kind === item.kind)
  );

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
        {added || !onInstall ? (
          <span className="text-[12px] text-muted-foreground">Added</span>
        ) : (
          <GhostButton
            className="h-7 px-2"
            disabled={installing}
            onClick={onInstall}
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
        {preview.description ? (
          <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
            {preview.description}
          </p>
        ) : null}

        {metaEntries.length > 0 ? (
          <dl className="mt-5 grid grid-cols-2 gap-3 text-[12px]">
            {metaEntries.map((entry) => (
              <div key={entry.label}>
                <dt className="text-muted-foreground">{entry.label}</dt>
                <dd className="mt-1 wrap-break-word">{entry.value}</dd>
              </div>
            ))}
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

        {preview.body ? (
          <div className="mt-5">
            <p className="text-[12px] font-medium text-muted-foreground">
              Body
            </p>
            <pre className="mt-1.5 max-h-112 overflow-auto rounded-lg border border-border bg-muted/30 p-3 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
              {preview.body}
            </pre>
          </div>
        ) : null}

        {resourcesByKind.length > 0 || otherResources.length > 0 ? (
          <div className="mt-5 flex flex-col gap-4">
            <p className="text-[12px] font-medium text-muted-foreground">
              Resources
            </p>
            {resourcesByKind.map((group) => (
              <div key={group.kind}>
                <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                  {group.label}
                </p>
                <ul className="mt-1.5 flex flex-col gap-1.5">
                  {group.items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center gap-2 rounded-lg border border-border px-2.5 py-1.5"
                    >
                      <span className="min-w-0 flex-1 truncate font-mono text-[11px]">
                        {item.path}
                      </span>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {formatBytes(item.size)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {otherResources.length > 0 ? (
              <div>
                <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                  Files
                </p>
                <ul className="mt-1.5 flex flex-col gap-1.5">
                  {otherResources.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center gap-2 rounded-lg border border-border px-2.5 py-1.5"
                    >
                      <span className="min-w-0 flex-1 truncate font-mono text-[11px]">
                        {item.path}
                      </span>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {formatBytes(item.size)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}

        {metadataEntries.length > 0 ? (
          <div className="mt-5">
            <p className="text-[12px] font-medium text-muted-foreground">
              Metadata
            </p>
            <dl className="mt-1.5 grid grid-cols-2 gap-3 text-[12px]">
              {metadataEntries.map(([key, value]) => (
                <div key={key}>
                  <dt className="text-muted-foreground">{key}</dt>
                  <dd className="mt-1 font-mono text-[11px] wrap-break-word">
                    {typeof value === "string" ? value : JSON.stringify(value)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ) : null}
      </div>
    </div>
  );
}
