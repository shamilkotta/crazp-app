"use client";

import { ChevronLeft, Plus, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { AgentDetailData } from "@/lib/agents";
import { catalog, catalogSourceLabel, type CatalogItem } from "@/lib/catalog";
import { formatCount } from "@/lib/display";
import { MarkdownEditor } from "@/components/board/markdown-editor";
import {
  Empty,
  Field,
  GhostButton,
  PrimaryButton,
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

export type SkillResourceKind = "script" | "reference" | "asset";

export type SkillResourceDraft = {
  kind: SkillResourceKind;
  path: string;
  mimeType?: string;
  encoding: "text" | "base64";
  content: string;
  size: number;
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
        className="grid grid-cols-2 rounded-lg bg-muted p-1 lg:hidden"
        role="tablist"
        aria-label="Skills sections"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mobileSection === "added"}
          className={cn(
            "rounded-md px-3 py-1.5 text-[13px] font-medium text-muted-foreground",
            mobileSection === "added" &&
              "bg-background text-foreground shadow-sm"
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
            "rounded-md px-3 py-1.5 text-[13px] font-medium text-muted-foreground",
            mobileSection === "catalog" &&
              "bg-background text-foreground shadow-sm"
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

        {creating ? (
          <div className="lg:hidden">
            <SkillCreateForm
              pending={pending}
              backLabel="Skills"
              onBack={() => setAside({ kind: "catalog" })}
              onCreate={handleCreate}
            />
          </div>
        ) : (
          <>
            <SkillSearch
              value={addedQuery}
              onChange={setAddedQuery}
              placeholder="Search added skills…"
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
                    <Surface
                      key={item.id}
                      className={cn(
                        "p-4",
                        !item.enabled && "opacity-50",
                        isSelected && "ring-1 ring-foreground/15"
                      )}
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-3">
                        <button
                          type="button"
                          className="min-w-0 flex-1 text-left"
                          onClick={() => {
                            setMobileSection("catalog");
                            setAside({
                              kind: "preview",
                              preview: previewFromAdded(item),
                            });
                          }}
                        >
                          <p className="font-medium hover:underline">
                            {item.name}
                          </p>
                          <p className="truncate text-[12px] text-muted-foreground">
                            {item.allowedTools ?? "all tools"}
                          </p>
                          {item.description ? (
                            <p className="mt-1 line-clamp-2 text-[12px] text-muted-foreground">
                              {item.description}
                            </p>
                          ) : null}
                        </button>
                        <div className="flex shrink-0 items-center gap-3">
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
                        </div>
                      </div>
                    </Surface>
                  );
                })}
              </div>
            )}
          </>
        )}
      </section>

      <aside
        className={cn(
          "flex-col lg:sticky lg:top-[53px] lg:flex lg:max-h-[calc(100dvh-3.8rem)] lg:overflow-hidden lg:border-l lg:pt-2 lg:pl-6",
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
                    <Surface
                      key={item.id}
                      className={cn(
                        "p-4",
                        isSelected && "ring-1 ring-foreground/15"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          className="min-w-0 flex-1 text-left"
                          onClick={() =>
                            setAside({
                              kind: "preview",
                              preview: previewFromCatalog(item),
                            })
                          }
                        >
                          <p className="font-medium hover:underline">
                            {item.name}
                          </p>
                          <p className="mt-0.5 line-clamp-2 text-[12px] text-muted-foreground">
                            {item.summary}
                          </p>
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            {item.source === "builtin"
                              ? catalogSourceLabel(item.source)
                              : item.author.handle}{" "}
                            · {formatCount(item.installs)}
                          </p>
                        </button>
                        {added ? (
                          <span className="mt-0.5 shrink-0 text-[12px] text-muted-foreground">
                            Added
                          </span>
                        ) : (
                          <GhostButton
                            className="mt-0.5 h-7 shrink-0 px-2"
                            disabled={installing}
                            onClick={() => handleInstall(item)}
                          >
                            {installing ? "Adding…" : "Add"}
                          </GhostButton>
                        )}
                      </div>
                    </Surface>
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
  eyebrow: string;
  author?: string;
  version?: string;
  installs?: number;
  tags: string[];
  allowedTools?: string | null;
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
  if (match) {
    return { ...previewFromCatalog(match), origin: "added", id: skill.id };
  }
  return {
    id: skill.id,
    origin: "added",
    name: skill.name,
    description: skill.body || skill.description,
    eyebrow: "skill · this agent",
    tags: [],
    allowedTools: skill.allowedTools,
    catalogItem: null,
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

const MAX_RESOURCE_BYTES = 512 * 1024;

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

function shouldReadAsText(file: File, kind: SkillResourceKind) {
  if (kind === "script" || kind === "reference") return true;
  if (file.type.startsWith("text/") || file.type === "application/json") {
    return true;
  }
  return /\.(md|txt|json|ya?ml|csv|xml|svg|html)$/i.test(file.name);
}

function readAsBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
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

  async function addFiles(
    kind: SkillResourceKind,
    folder: string,
    files: FileList | null
  ) {
    if (!files || files.length === 0) return;
    setError(null);
    const used = new Set(value.map((item) => item.path));
    const next: SkillResourceItem[] = [];

    for (const file of Array.from(files)) {
      if (file.size > MAX_RESOURCE_BYTES) {
        setError(`${file.name} is larger than 512 KB.`);
        continue;
      }
      if (value.length + next.length >= 20) {
        setError("You can attach up to 20 files.");
        break;
      }
      const path = resourcePath(folder, file.name, used);
      used.add(path);
      const encoding = shouldReadAsText(file, kind) ? "text" : "base64";
      const content =
        encoding === "text" ? await file.text() : await readAsBase64(file);
      next.push({
        id: crypto.randomUUID(),
        kind,
        path,
        mimeType: file.type || undefined,
        encoding,
        content,
        size: file.size,
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
                    void addFiles(group.kind, group.folder, event.target.files);
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
        encoding: item.encoding,
        content: item.content,
        size: item.size,
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
      <div className="mb-3 flex shrink-0 items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-3.5" />
          {backLabel}
        </button>
        <PrimaryButton type="submit" disabled={!canSubmit || pending}>
          {pending ? "Creating…" : "Create"}
        </PrimaryButton>
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
        <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
          {preview.description}
        </p>
        {preview.author || preview.version || preview.installs != null ? (
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
            {preview.allowedTools ? (
              <div>
                <dt className="text-muted-foreground">Tools</dt>
                <dd className="mt-1">{preview.allowedTools}</dd>
              </div>
            ) : null}
          </dl>
        ) : preview.allowedTools ? (
          <p className="mt-5 text-[12px] text-muted-foreground">
            Tools: {preview.allowedTools}
          </p>
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
