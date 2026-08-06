"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Bot, LogOut } from "lucide-react";
import { authClient } from "@workspace/auth/client";
import {
  OrganizationSwitcher,
  type OrganizationOption,
} from "@/components/organization-switcher";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Session } from "@workspace/auth";

function userInitials(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.trim() || "?";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export function DashboardHeader({
  organizations,
  session,
}: {
  organizations: OrganizationOption[];
  session: Session;
}) {
  const router = useRouter();
  const params = useParams<{ teamSlug?: string }>();
  const teamSlug = typeof params.teamSlug === "string" ? params.teamSlug : null;
  const {
    user: { name: userName, email: userEmail, image: userImage },
    session: { activeOrganizationId },
  } = session;

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

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon" className="rounded-full" />
            }
          >
            <Avatar>
              {userImage ? (
                <AvatarImage src={userImage} alt={userName ?? "User"} />
              ) : null}
              <AvatarFallback>
                {userInitials(userName, userEmail)}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-0.5">
                  <span className="truncate text-sm font-medium text-foreground">
                    {userName || "Account"}
                  </span>
                  {userEmail ? (
                    <span className="truncate text-xs text-muted-foreground">
                      {userEmail}
                    </span>
                  ) : null}
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
