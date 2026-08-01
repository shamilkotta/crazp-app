import { AgentsDashboard } from "@/components/agents-dashboard";

export default async function TeamHomePage({
  params,
}: {
  params: Promise<{ teamSlug: string }>;
}) {
  const { teamSlug } = await params;

  return <AgentsDashboard agents={[]} teamSlug={teamSlug} />;
}
