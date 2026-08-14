import {
  createAgent,
  createAgentChannel,
  createAgentConnection,
  createAgentSkill,
  createAgentSubagent,
  createAgentTool,
} from "@/lib/actions/agents";
import type { CatalogItem } from "@/lib/catalog";

const CHANNEL_PROVIDERS = [
  "slack",
  "whatsapp",
  "telegram",
  "discord",
  "web",
  "email",
] as const;

type ChannelProvider = (typeof CHANNEL_PROVIDERS)[number];

function isChannelProvider(value: string): value is ChannelProvider {
  return (CHANNEL_PROVIDERS as readonly string[]).includes(value);
}

function channelProvider(item: CatalogItem): ChannelProvider {
  if (isChannelProvider(item.slug)) return item.slug;
  if (item.slug === "web-widget") return "web";
  return "web";
}

function connectionAuthType(item: CatalogItem) {
  if (item.tags.includes("oauth")) return "oauth" as const;
  return "api_key" as const;
}

function formData(entries: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    data.set(key, value);
  }
  return data;
}

export async function installCatalogItem(input: {
  teamSlug: string;
  agentId: string;
  item: CatalogItem;
  values: Record<string, string>;
  model?: string;
}) {
  const { teamSlug, agentId, item, values, model } = input;
  const credentialLabel =
    values.botToken ||
    values.accessToken ||
    values.apiKey ||
    values.credentialLabel ||
    item.name;

  switch (item.kind) {
    case "tool":
      await createAgentTool(
        formData({
          teamSlug,
          agentId,
          name: item.name,
          kind: item.source === "builtin" ? "builtin" : "external",
          description: item.summary,
        })
      );
      return { kind: "resource" as const };

    case "skill":
      await createAgentSkill(
        formData({
          teamSlug,
          agentId,
          name: item.name,
          description: item.summary,
          body: item.description,
        })
      );
      return { kind: "resource" as const };

    case "channel":
      await createAgentChannel(
        formData({
          teamSlug,
          agentId,
          provider: channelProvider(item),
          displayName: item.name,
          credentialLabel,
        })
      );
      return { kind: "resource" as const };

    case "connection":
      await createAgentConnection(
        formData({
          teamSlug,
          agentId,
          provider: item.slug,
          displayName: item.name,
          authType: connectionAuthType(item),
          credentialLabel,
        })
      );
      return { kind: "resource" as const };

    case "subagent":
      await createAgentSubagent(
        formData({
          teamSlug,
          agentId,
          displayName: item.name,
          description: item.summary,
          instructions: item.description,
          model: model ?? "@cf/moonshotai/kimi-k2.6",
          maxSteps: "250",
        })
      );
      return { kind: "resource" as const };

    case "template": {
      const created = await createAgent({
        teamSlug,
        name: item.name,
        instructions: item.description,
      });
      if (!created.ok) {
        return { kind: "error" as const, error: created.error };
      }
      return {
        kind: "agent" as const,
        agentId: created.agent.id,
        agentSlug: created.agent.slug,
      };
    }
  }
}
