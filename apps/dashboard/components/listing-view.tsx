"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { AgentListItem } from "@/lib/agents";
import type { CatalogItem } from "@/lib/catalog";
import { catalogSourceLabel } from "@/lib/catalog";
import { formatCount } from "@/lib/display";
import { installCatalogItem } from "@/lib/install-catalog";
import {
  Field,
  GhostButton,
  PrimaryButton,
  Surface,
  inputClass,
} from "@/components/board/ui";

export function ListingView({
  item,
  agents,
  teamSlug,
}: {
  item: CatalogItem;
  agents: AgentListItem[];
  teamSlug: string;
}) {
  const router = useRouter();
  const [agentId, setAgentId] = useState(agents[0]?.id ?? "");
  const [values, setValues] = useState<Record<string, string>>({});
  const [installed, setInstalled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const needsAgent = item.kind !== "template";
  const canInstall =
    item.fields
      .filter((field) => field.required)
      .every((field) => values[field.key]) &&
    (!needsAgent || Boolean(agentId));

  const agentName =
    agents.find((agent) => agent.id === agentId)?.name ?? "the agent";
  const selectedAgent = agents.find((agent) => agent.id === agentId);

  function handleInstall() {
    if (!canInstall) return;
    setError(null);
    startTransition(async () => {
      const result = await installCatalogItem({
        teamSlug,
        agentId,
        item,
        values,
        model: selectedAgent?.model,
      });
      if (result.kind === "error") {
        setError(result.error);
        return;
      }
      if (result.kind === "agent") {
        router.push(`/${teamSlug}/agents/${result.agentSlug}`);
        router.refresh();
        return;
      }
      setInstalled(true);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
      <div>
        <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          {item.kind} · {catalogSourceLabel(item.source)}
        </p>
        <h2 className="mt-2 text-[24px] font-medium tracking-tight sm:text-[28px]">
          {item.name}
        </h2>
        <p className="mt-4 max-w-[60ch] text-[14px] leading-relaxed text-muted-foreground">
          {item.description}
        </p>
        <dl className="mt-8 grid grid-cols-3 gap-3 text-[12px] sm:gap-4">
          <div>
            <dt className="text-muted-foreground">Author</dt>
            <dd className="mt-1">{item.author.name}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Version</dt>
            <dd className="mt-1">{item.version}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Installs</dt>
            <dd className="mt-1">{formatCount(item.installs)}</dd>
          </div>
        </dl>
      </div>

      <Surface className="p-4 sm:p-6">
        {needsAgent && agents.length === 0 ? (
          <div className="flex flex-col items-start gap-3 py-2">
            <p className="font-medium">Create an agent first</p>
            <p className="text-[13px] text-muted-foreground">
              Listings install onto an existing agent. Start a draft, then come
              back here.
            </p>
            <Link href={`/${teamSlug}/new`}>
              <PrimaryButton>New agent</PrimaryButton>
            </Link>
          </div>
        ) : installed ? (
          <div className="flex flex-col items-start gap-3 py-2">
            <span className="inline-flex size-8 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <Check className="size-4" />
            </span>
            <p className="font-medium">Installed on {agentName}</p>
            <p className="text-[13px] text-muted-foreground">
              The agent can use this on the next deploy.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link href={`/${teamSlug}/agents/${selectedAgent?.slug ?? ""}`}>
                <PrimaryButton>Open agent</PrimaryButton>
              </Link>
              <GhostButton onClick={() => setInstalled(false)}>
                Install again
              </GhostButton>
            </div>
          </div>
        ) : (
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              handleInstall();
            }}
          >
            <p className="font-medium">
              {item.kind === "template"
                ? "Create from this template"
                : "Install onto an agent"}
            </p>
            {needsAgent ? (
              <Field label="Agent">
                <select
                  value={agentId}
                  onChange={(event) => setAgentId(event.target.value)}
                  className={inputClass}
                >
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name}
                    </option>
                  ))}
                </select>
              </Field>
            ) : null}
            {item.fields.map((field) => (
              <Field key={field.key} label={field.label} hint={field.help}>
                {field.type === "select" ? (
                  <select
                    value={values[field.key] ?? ""}
                    onChange={(event) =>
                      setValues((prev) => ({
                        ...prev,
                        [field.key]: event.target.value,
                      }))
                    }
                    className={inputClass}
                  >
                    <option value="">Choose…</option>
                    {field.options?.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type === "secret" ? "password" : "text"}
                    placeholder={field.placeholder}
                    value={values[field.key] ?? ""}
                    onChange={(event) =>
                      setValues((prev) => ({
                        ...prev,
                        [field.key]: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                )}
              </Field>
            ))}
            {error ? (
              <p className="text-[12px] text-red-600 dark:text-red-400">
                {error}
              </p>
            ) : null}
            <PrimaryButton
              type="submit"
              disabled={!canInstall || pending}
              className="w-full"
            >
              {pending
                ? "Installing…"
                : item.kind === "template"
                  ? "Create agent"
                  : "Install"}
            </PrimaryButton>
          </form>
        )}
      </Surface>
    </div>
  );
}
