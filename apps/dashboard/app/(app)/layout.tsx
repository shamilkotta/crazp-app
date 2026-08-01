import { DashboardHeader } from "@/components/dashboard-header";
import { requireSession } from "@/lib/session";
import { getAuth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <DashboardHeader
        organizationName={organizationName}
        userName={session.user.name}
      />
      {children}
    </div>
  );
}
