import { SettingsView } from "@/components/settings-view";
import { listOrganizationMembers } from "@/lib/organization";
import { requireTeam } from "@/lib/team";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ teamSlug: string }>;
}) {
  const { teamSlug } = await params;
  const { organization } = await requireTeam(teamSlug);
  const { members, error: membersError } = await listOrganizationMembers(
    organization.id
  );
  return (
    <SettingsView
      organization={organization}
      members={members}
      membersError={membersError}
    />
  );
}
