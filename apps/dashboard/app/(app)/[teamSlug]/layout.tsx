import { headers } from "next/headers";
import { AppShell } from "@/components/board/shell";
import { listOrganizationAgents } from "@/lib/agents";
import { getAuth } from "@/lib/auth";
import { requireTeam } from "@/lib/team";

export default async function TeamLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ teamSlug: string }>;
}) {
  const { teamSlug } = await params;
  const { session, organizations, organization } = await requireTeam(teamSlug);

  if (session.session.activeOrganizationId !== organization.id) {
    try {
      const auth = getAuth();
      await auth.api.setActiveOrganization({
        body: { organizationId: organization.id },
        headers: await headers(),
      });
    } catch {
      // Session may already be aligned; continue rendering.
    }
  }

  const agents = await listOrganizationAgents(organization.id);

  return (
    <AppShell
      teamSlug={teamSlug}
      organization={organization}
      organizations={organizations}
      user={{
        name: session.user.name ?? "",
        email: session.user.email ?? "",
      }}
      agents={agents}
    >
      {children}
    </AppShell>
  );
}
