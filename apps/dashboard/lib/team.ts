import { notFound } from "next/navigation";
import { cache } from "react";
import { getOrganizationAgent } from "@/lib/agents";
import {
  findOrganizationBySlug,
  listUserOrganizations,
} from "@/lib/organization";
import { requireSession } from "@/lib/session";

export const getTeamContext = cache(async (teamSlug: string) => {
  const [session, organizations] = await Promise.all([
    requireSession(),
    listUserOrganizations(),
  ]);
  return {
    session,
    organizations,
    organization: findOrganizationBySlug(organizations, teamSlug),
  };
});

export const requireTeam = cache(async (teamSlug: string) => {
  const context = await getTeamContext(teamSlug);
  if (!context.organization) {
    notFound();
  }
  return {
    session: context.session,
    organizations: context.organizations,
    organization: context.organization,
  };
});

export const requireTeamAgent = cache(
  async (teamSlug: string, agentSlug: string) => {
    const team = await requireTeam(teamSlug);
    const agent = await getOrganizationAgent(team.organization.id, agentSlug);
    if (!agent) {
      notFound();
    }
    return { ...team, agent };
  }
);
