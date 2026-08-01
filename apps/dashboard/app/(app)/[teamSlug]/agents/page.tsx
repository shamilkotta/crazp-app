import { AgentsDashboard } from "@/components/agents-dashboard";
import { mockAgents } from "@/lib/mock-data";

export default async function AgentsPage({
  params,
}: {
  params: Promise<{ teamSlug: string }>;
}) {
  const { teamSlug } = await params;

  return <AgentsDashboard agents={mockAgents} teamSlug={teamSlug} />;
}
