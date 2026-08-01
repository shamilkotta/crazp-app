import { AgentsDashboard } from "@/components/agents-dashboard";
import { requireSession } from "@/lib/session";
import { getAuth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function AgentsPage() {
  const session = await requireSession();

  let organizationName: string | null = null;
  const activeOrgId = session.session.activeOrganizationId;

  if (activeOrgId) {
    try {
      const auth = await getAuth();
      const org = await auth.api.getFullOrganization({
        headers: await headers(),
        query: { organizationId: activeOrgId },
      });
      organizationName = org?.name ?? null;
    } catch {
      organizationName = null;
    }
  }

  return <AgentsDashboard organizationName={organizationName} />;
}
