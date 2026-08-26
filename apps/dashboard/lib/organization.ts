import { headers } from "next/headers";
import { cache } from "react";
import { getAuth } from "@/lib/auth";

export type OrganizationSummary = {
  id: string;
  name: string;
  slug: string;
};

export const listUserOrganizations = cache(
  async (): Promise<OrganizationSummary[]> => {
    const auth = getAuth();

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
);

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

export type OrganizationMember = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export const listOrganizationMembers = cache(
  async (
    organizationId: string
  ): Promise<{ members: OrganizationMember[]; error: string | null }> => {
    const auth = getAuth();

    try {
      const result = await auth.api.listMembers({
        query: { organizationId },
        headers: await headers(),
      });
      const members = (result?.members ?? []).map((member) => ({
        id: member.id,
        name: member.user.name || member.user.email,
        email: member.user.email,
        role: member.role,
      }));
      return { members, error: null };
    } catch {
      return { members: [], error: "Could not load members." };
    }
  }
);
