"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { createAgent } from "@/lib/actions/agents";
import { slugifyAgentName } from "@/lib/display";
import type { CatalogItem } from "@/lib/catalog";
import { MarkdownEditor } from "@/components/board/markdown-editor";
import {
  Field,
  GhostButton,
  PrimaryButton,
  Surface,
  inputClass,
} from "@/components/board/ui";
import { cn } from "@workspace/ui/lib/utils";

export function CreateAgentForm({
  teamSlug,
  templates,
}: {
  teamSlug: string;
  templates: CatalogItem[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromTemplate = searchParams.get("from") === "template";
  const [template, setTemplate] = useState<string>(
    fromTemplate ? (templates[0]?.slug ?? "blank") : "blank"
  );
  const [name, setName] = useState("");
  const [instructions, setInstructions] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const slug = useMemo(() => slugifyAgentName(name || "agent"), [name]);
  const selected = templates.find((item) => item.slug === template);

  function applyTemplate(slugValue: string) {
    setTemplate(slugValue);
    const item = templates.find((entry) => entry.slug === slugValue);
    if (!item) return;
    if (!name) setName(item.name);
    if (!instructions) setInstructions(item.description);
  }

  function handleCreate() {
    const trimmedName = name.trim();
    const trimmedInstructions = instructions.trim();
    if (!trimmedName) {
      setError("Give the agent a name.");
      return;
    }
    if (!trimmedInstructions) {
      setError("Add instructions so the agent knows what to do.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await createAgent({
        teamSlug,
        name: trimmedName,
        instructions: trimmedInstructions,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/${teamSlug}/agents/${result.agent.slug}`);
      router.refresh();
    });
  }

  return (
    <div className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-[1fr_280px] lg:gap-8">
      <div>
        <p className="mb-3 text-[12px] font-medium text-muted-foreground">
          Start from
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setTemplate("blank")}
            className={cn(
              "rounded-xl border p-4 text-left",
              template === "blank"
                ? "border-foreground/30 bg-muted/50"
                : "border-border hover:bg-muted/40"
            )}
          >
            <p className="font-medium">Blank agent</p>
            <p className="mt-1 text-[12px] text-muted-foreground">
              Name it, write instructions, add capabilities later.
            </p>
          </button>
          {templates.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => applyTemplate(item.slug)}
              className={cn(
                "rounded-xl border p-4 text-left",
                template === item.slug
                  ? "border-foreground/30 bg-muted/50"
                  : "border-border hover:bg-muted/40"
              )}
            >
              <p className="font-medium">{item.name}</p>
              <p className="mt-1 line-clamp-2 text-[12px] text-muted-foreground">
                {item.summary}
              </p>
            </button>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-4">
          <Field label="Name">
            <input
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (error) setError(null);
              }}
              placeholder="Support Triage"
              className={inputClass}
            />
          </Field>
          <Field
            label="Instructions"
            hint="This is what the agent actually is. Be specific about what it should and should not do."
          >
            <MarkdownEditor
              className="min-h-72"
              value={instructions}
              onChange={(value) => {
                setInstructions(value);
                if (error) setError(null);
              }}
              placeholder="Read every inbound support message…"
            />
          </Field>
          {error ? (
            <p className="text-[12px] text-red-600 dark:text-red-400">
              {error}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            <PrimaryButton
              disabled={!name.trim() || pending}
              onClick={handleCreate}
            >
              {pending ? "Creating…" : "Create draft"}
            </PrimaryButton>
            <Link href={`/${teamSlug}`}>
              <GhostButton>Cancel</GhostButton>
            </Link>
          </div>
        </div>
      </div>

      <aside className="flex flex-col gap-3 text-[12px] text-muted-foreground">
        <Surface className="p-5">
          <p className="font-medium text-foreground">Will be created as</p>
          <p className="mt-2">{slug}.crazp.dev</p>
          <p className="mt-1">Status: draft · not reachable yet</p>
        </Surface>
        {selected ? (
          <Surface className="p-5">
            <p className="font-medium text-foreground">
              This template includes
            </p>
            <ul className="mt-2 list-disc pl-4">
              {selected.includes?.map((line) => (
                <li key={line} className="mt-1">
                  {line}
                </li>
              ))}
            </ul>
          </Surface>
        ) : (
          <Surface className="p-5">
            <p className="font-medium text-foreground">After this</p>
            <p className="mt-2">
              Add tools and a channel from the catalog, then deploy. The agent
              stays a draft until you do.
            </p>
          </Surface>
        )}
      </aside>
    </div>
  );
}
