import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";

export type OrganizationSummary = {
  id: string;
  name: string;
  slug: string;
};

export async function listUserOrganizations(): Promise<OrganizationSummary[]> {
  const auth = await getAuth();

  try {
    const listed = await auth.api.listOrganizations({
      headers: await headers(),
    });

    return (listed ?? []).map((org) => ({
      id: org.id,
      name: org.name,
      slug: org.slug,
    }));
  } catch {
    return [];
  }
}

export function getDefaultTeamSlug(
  organizations: OrganizationSummary[],
  activeOrganizationId?: string | null
): string | null {
  if (organizations.length === 0) {
    return null;
  }

  const active = organizations.find((org) => org.id === activeOrganizationId);
  return active?.slug ?? organizations[0]?.slug ?? null;
}

export function findOrganizationBySlug(
  organizations: OrganizationSummary[],
  teamSlug: string
): OrganizationSummary | null {
  return organizations.find((org) => org.slug === teamSlug) ?? null;
}
