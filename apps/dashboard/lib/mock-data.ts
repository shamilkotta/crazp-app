export type MockAgent = {
  id: string;
  name: string;
  slug: string;
  description: string;
  model: string;
  provider: string;
  status: "active" | "draft" | "paused" | "error";
  lastRunAt: Date;
  runsToday: number;
  integrations: string[];
};

export const mockAgents: MockAgent[] = [
  {
    id: "agent-1",
    name: "Customer Support Bot",
    slug: "customer-support",
    description: "Handles tier-1 support tickets with knowledge base context",
    model: "gpt-4o",
    provider: "OpenAI",
    status: "active",
    lastRunAt: new Date(Date.now() - 1000 * 60 * 12),
    runsToday: 847,
    integrations: ["Slack", "Zendesk"],
  },
  {
    id: "agent-2",
    name: "Sales Outreach",
    slug: "sales-outreach",
    description: "Personalized outbound sequences for qualified leads",
    model: "claude-sonnet-4",
    provider: "Anthropic",
    status: "active",
    lastRunAt: new Date(Date.now() - 1000 * 60 * 45),
    runsToday: 124,
    integrations: ["HubSpot", "Gmail"],
  },
  {
    id: "agent-3",
    name: "Code Review Assistant",
    slug: "code-review",
    description: "Reviews PRs and suggests improvements",
    model: "gpt-4o-mini",
    provider: "OpenAI",
    status: "paused",
    lastRunAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
    runsToday: 0,
    integrations: ["GitHub"],
  },
  {
    id: "agent-4",
    name: "Research Analyst",
    slug: "research-analyst",
    description: "Aggregates market data and generates briefings",
    model: "gemini-2.0-flash",
    provider: "Google",
    status: "draft",
    lastRunAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    runsToday: 0,
    integrations: [],
  },
  {
    id: "agent-5",
    name: "Onboarding Guide",
    slug: "onboarding-guide",
    description: "Walks new users through product setup",
    model: "gpt-4o",
    provider: "OpenAI",
    status: "error",
    lastRunAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    runsToday: 23,
    integrations: ["Intercom"],
  },
  {
    id: "agent-6",
    name: "Content Writer",
    slug: "content-writer",
    description: "Drafts blog posts and social content from briefs",
    model: "claude-sonnet-4",
    provider: "Anthropic",
    status: "active",
    lastRunAt: new Date(Date.now() - 1000 * 60 * 90),
    runsToday: 56,
    integrations: ["Notion"],
  },
];

export function getAgent(id: string) {
  return mockAgents.find((a) => a.id === id);
}

export const usageStats = {
  agentRuns: { used: 2847, limit: 10000 },
  tokens: { used: 4.2, limit: 50, unit: "M" },
  storage: { used: 1.8, limit: 10, unit: "GB" },
};
