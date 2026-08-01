import { AgentDetailPage } from "@/components/agent-detail";

export default async function AgentPage({
  params,
}: {
  params: Promise<{ teamSlug: string; id: string }>;
}) {
  const { teamSlug, id } = await params;
  return <AgentDetailPage agentId={id} dashboardPath={`/${teamSlug}`} />;
}
