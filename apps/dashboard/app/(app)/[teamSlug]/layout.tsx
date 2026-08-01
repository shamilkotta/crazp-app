import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { requireSession } from "@/lib/session";
import {
  findOrganizationBySlug,
  listUserOrganizations,
} from "@/lib/organization";

export default async function TeamLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ teamSlug: string }>;
}) {
  const { teamSlug } = await params;
  const [session, organizations, auth, requestHeaders] = await Promise.all([
    requireSession(),
    listUserOrganizations(),
    getAuth(),
    headers(),
  ]);

  const organization = findOrganizationBySlug(organizations, teamSlug);
  if (!organization) {
    notFound();
  }

  if (session.session.activeOrganizationId !== organization.id) {
    try {
      await auth.api.setActiveOrganization({
        body: { organizationId: organization.id },
        headers: requestHeaders,
      });
    } catch {
      // Session may already be aligned; continue rendering.
    }
  }

  return children;
}
