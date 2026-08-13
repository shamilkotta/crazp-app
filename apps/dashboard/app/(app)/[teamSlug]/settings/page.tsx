import { SettingsView } from "@/components/settings-view";
import { requireTeam } from "@/lib/team";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ teamSlug: string }>;
}) {
  const { teamSlug } = await params;
  const { organization } = await requireTeam(teamSlug);
  return <SettingsView organization={organization} />;
}
