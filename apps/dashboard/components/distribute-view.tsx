"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

import type { AgentDetailData } from "@/lib/agents";
import { agentPublicUrl } from "@/lib/display";
import { Empty, Surface, TextButton } from "@/components/board/ui";

export function DistributeView({ agent }: { agent: AgentDetailData }) {
  const [copied, setCopied] = useState<string | null>(null);
  const url = agentPublicUrl(agent);
  const widgetScript = `<script src="${url}/widget.js" data-agent="${agent.slug}"></script>`;
  const curlExample = `curl -X POST ${url}/run \\
  -H "Authorization: Bearer $CRAZP_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"message":"Hello"}'`;

  function copy(label: string, value: string) {
    void navigator.clipboard?.writeText(value);
    setCopied(label);
    window.setTimeout(() => setCopied(null), 1200);
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Surface className="p-4 sm:p-6">
        <p className="font-medium">Live endpoint</p>
        <p className="mt-1 text-[13px] text-muted-foreground">
          {agent.status === "active"
            ? "Anyone with a key can call this agent. Channels already connected do not need a key."
            : "This URL is reserved. It becomes reachable after a successful deploy."}
        </p>
        <CodeRow
          label="URL"
          value={url}
          copied={copied === "URL"}
          onCopy={() => copy("URL", url)}
        />
      </Surface>

      <Surface className="p-4 sm:p-6">
        <p className="font-medium">Web widget</p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-muted px-3 py-2 text-[12px]">
          {widgetScript}
        </pre>
        <TextButton
          className="mt-2"
          onClick={() => copy("widget", widgetScript)}
        >
          {copied === "widget" ? "Copied" : "Copy snippet"}
        </TextButton>
      </Surface>

      <Surface className="p-4 sm:p-6">
        <p className="font-medium">From code</p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-muted px-3 py-2 text-[12px]">
          {curlExample}
        </pre>
      </Surface>

      <div>
        <p className="mb-3 font-medium">API keys</p>
        <Surface>
          <Empty
            title="No API keys yet"
            body="Keys are not stored in the dashboard yet. Use org secrets or channel credentials until this ships."
          />
        </Surface>
      </div>
    </div>
  );
}

function CodeRow({
  label,
  value,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="mt-4 flex flex-col gap-2 rounded-lg border border-border px-3 py-2 sm:flex-row sm:items-center">
      <div className="flex min-w-0 items-center gap-2">
        <span className="shrink-0 text-[11px] text-muted-foreground">
          {label}
        </span>
        <code className="min-w-0 flex-1 truncate text-[12px]">{value}</code>
      </div>
      <TextButton
        className="self-start sm:ml-auto sm:self-auto"
        onClick={onCopy}
      >
        {copied ? (
          <Check className="size-3.5" />
        ) : (
          <Copy className="size-3.5" />
        )}
        {copied ? "Copied" : "Copy"}
      </TextButton>
    </div>
  );
}
