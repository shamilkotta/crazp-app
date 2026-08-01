import { AgentDetailPage } from "@/components/agent-detail";

export default async function AgentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AgentDetailPage agentId={id} dashboardPath="/agents" />;
}
