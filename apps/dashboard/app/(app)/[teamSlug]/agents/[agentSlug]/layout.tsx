import { AgentChrome } from "@/components/board/agent-chrome";
import { requireTeamAgent } from "@/lib/team";

export default async function AgentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ teamSlug: string; agentSlug: string }>;
}) {
  const { teamSlug, agentSlug } = await params;
  const { agent } = await requireTeamAgent(teamSlug, agentSlug);

  return (
    <>
      <AgentChrome teamSlug={teamSlug} agent={agent} />
      {children}
    </>
  );
}
