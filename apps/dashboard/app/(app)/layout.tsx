import { DashboardHeader } from "@/components/dashboard-header";
import { requireSession } from "@/lib/session";
import { listUserOrganizations } from "@/lib/organization";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, organizations] = await Promise.all([
    requireSession(),
    listUserOrganizations(),
  ]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <DashboardHeader organizations={organizations} session={session} />
      {children}
    </div>
  );
}
