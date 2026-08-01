import { redirect } from "next/navigation";
import { requireSession } from "@/lib/session";
import { getDefaultTeamSlug, listUserOrganizations } from "@/lib/organization";

export default async function RootPage() {
  const session = await requireSession();
  const organizations = await listUserOrganizations();
  const teamSlug = getDefaultTeamSlug(
    organizations,
    session.session.activeOrganizationId
  );

  if (!teamSlug) {
    redirect("/sign-in");
  }

  redirect(`/${teamSlug}`);
}
