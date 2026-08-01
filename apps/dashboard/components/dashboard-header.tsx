"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Bot, LogOut } from "lucide-react";
import { authClient } from "@workspace/auth/client";
import {
  OrganizationSwitcher,
  type OrganizationOption,
} from "@/components/organization-switcher";
import { Button } from "@workspace/ui/components/button";

export function DashboardHeader({
  organizations,
  activeOrganizationId,
  userName,
}: {
  organizations: OrganizationOption[];
  activeOrganizationId?: string | null;
  userName?: string | null;
}) {
  const router = useRouter();
  const params = useParams<{ teamSlug?: string }>();
  const teamSlug = typeof params.teamSlug === "string" ? params.teamSlug : null;

  const homeHref =
    teamSlug ??
    organizations.find((org) => org.id === activeOrganizationId)?.slug ??
    organizations[0]?.slug;

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/sign-in");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <Link
            href={homeHref ? `/${homeHref}` : "/"}
            className="flex items-center gap-2 font-semibold"
          >
            <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Bot />
            </div>
            <span>crazp</span>
          </Link>
          {organizations.length > 0 ? (
            <>
              <span className="hidden text-muted-foreground sm:inline">/</span>
              <OrganizationSwitcher
                organizations={organizations}
                activeOrganizationId={activeOrganizationId}
                activeTeamSlug={teamSlug}
              />
            </>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {userName ? (
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {userName}
            </span>
          ) : null}
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut data-icon="inline-start" />
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}
