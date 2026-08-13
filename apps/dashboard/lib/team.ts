import { notFound } from "next/navigation";
import {
  findOrganizationBySlug,
  listUserOrganizations,
} from "@/lib/organization";
import { requireSession } from "@/lib/session";

export async function requireTeam(teamSlug: string) {
  const [session, organizations] = await Promise.all([
    requireSession(),
    listUserOrganizations(),
  ]);
  const organization = findOrganizationBySlug(organizations, teamSlug);
  if (!organization) {
    notFound();
  }
  return { session, organizations, organization };
}
