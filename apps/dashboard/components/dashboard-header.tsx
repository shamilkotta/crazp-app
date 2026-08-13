"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Bot, Command, LogOut, Sparkles } from "lucide-react";
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
  const params = useParams<{ id?: string; teamSlug?: string }>();
  const teamSlug = typeof params.teamSlug === "string" ? params.teamSlug : null;
  const isAgentDetailPage = typeof params.id === "string";
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
    <header className="sticky top-0 z-50 border-b bg-background/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href={homeHref ? `/${homeHref}` : "/"}
            className="group flex items-center gap-2.5 font-semibold"
          >
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-95">
              <Bot />
            </div>
            <div className="hidden leading-tight sm:block">
              <span className="block">crazp</span>
              <span className="block text-[10px] font-normal tracking-wider text-muted-foreground uppercase">
                Agent Cloud
              </span>
            </div>
          </Link>
          {organizations.length > 0 && !isAgentDetailPage ? (
            <>
              <OrganizationSwitcher
                organizations={organizations}
                activeOrganizationId={activeOrganizationId}
                activeTeamSlug={teamSlug}
              />
            </>
          ) : null}
        </div>

        <div className="hidden min-w-0 flex-1 items-center justify-center lg:flex">
          <div className="flex h-9 w-full max-w-md items-center gap-2 rounded-full border bg-card/80 px-3 text-sm text-muted-foreground shadow-sm">
            <Command />
            <span className="truncate">Search agents, tools, skills...</span>
            <span className="ms-auto rounded-md border px-1.5 py-0.5 font-mono text-[10px]">
              ⌘K
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="hidden sm:inline-flex">
            <Sparkles data-icon="inline-start" />
            Marketplace
          </Button>
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
      </div>
    </header>
  );
}
