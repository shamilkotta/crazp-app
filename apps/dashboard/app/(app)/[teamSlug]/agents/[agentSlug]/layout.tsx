import { notFound } from "next/navigation";
import { AgentChrome } from "@/components/board/agent-chrome";
import { getOrganizationAgent } from "@/lib/agents";
import { requireTeam } from "@/lib/team";

export default async function AgentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ teamSlug: string; agentSlug: string }>;
}) {
  const { teamSlug, agentSlug } = await params;
  const { organization } = await requireTeam(teamSlug);
  const agent = await getOrganizationAgent(organization.id, agentSlug);
  if (!agent) {
    notFound();
  }

  return (
    <>
      <AgentChrome teamSlug={teamSlug} agent={agent} />
      {children}
    </>
  );
}
