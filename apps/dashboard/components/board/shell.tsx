"use client";

import { Check, ChevronDown, LogOut, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";

import { authClient } from "@workspace/auth/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { cn } from "@workspace/ui/lib/utils";
import type { AgentListItem } from "@/lib/agents";
import { slugifyTeamName, statusLabel } from "@/lib/display";
import type { OrganizationSummary } from "@/lib/organization";
import {
  AgentMark,
  PrimaryButton,
  StatusDot,
  TeamMark,
  UserAvatar,
  inputClass,
} from "@/components/board/ui";

export type ShellUser = {
  name: string;
  email: string;
};

const SHELL_ACTIONS_ID = "app-shell-actions";

export function ShellActions({ children }: { children: React.ReactNode }) {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    setTarget(document.getElementById(SHELL_ACTIONS_ID));
  }, []);

  if (!target) return null;
  return createPortal(children, target);
}

export function AppShell({
  teamSlug,
  organization,
  organizations,
  user,
  agents,
  children,
}: {
  teamSlug: string;
  organization: OrganizationSummary;
  organizations: OrganizationSummary[];
  user: ShellUser;
  agents: AgentListItem[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const agentMatch = pathname.match(/^\/[^/]+\/agents\/([^/]+)/);
  const area: "org" | "agent" = agentMatch ? "agent" : "org";
  const currentAgent =
    agents.find((agent) => agent.id === agentMatch?.[1]) ?? null;
  const [createOpen, setCreateOpen] = useState(false);

  const orgNav = [
    { href: `/${teamSlug}`, label: "Agents" },
    { href: `/${teamSlug}/catalog`, label: "Catalog" },
    { href: `/${teamSlug}/settings`, label: "Settings" },
  ];

  const agentTabs = currentAgent
    ? [
        { href: `/${teamSlug}/agents/${currentAgent.id}`, label: "Overview" },
        { href: `/${teamSlug}/agents/${currentAgent.id}/runs`, label: "Runs" },
        {
          href: `/${teamSlug}/agents/${currentAgent.id}/playground`,
          label: "Playground",
        },
        {
          href: `/${teamSlug}/agents/${currentAgent.id}/distribute`,
          label: "Distribute",
        },
      ]
    : [];

  const navItems =
    area === "agent" && currentAgent
      ? agentTabs.map((item) => ({
          ...item,
          active: pathname === item.href,
        }))
      : orgNav.map((item) => ({
          ...item,
          active: orgNavActive(pathname, item.href, teamSlug),
        }));

  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip bg-background font-sans text-[13px] text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
        <div className="flex h-12 min-w-0 items-center gap-2 px-3 sm:gap-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <Link
              href={`/${teamSlug}`}
              className="shrink-0 text-[15px] font-semibold tracking-tight"
            >
              crazp
            </Link>
            <span className="shrink-0 text-border">/</span>
            {area === "agent" && currentAgent ? (
              <AgentSwitcher
                teamSlug={teamSlug}
                current={currentAgent}
                agents={agents}
              />
            ) : (
              <TeamSwitcher
                org={organization}
                orgs={organizations}
                onCreate={() => setCreateOpen(true)}
              />
            )}
            <nav className="ml-1 hidden items-center gap-0.5 md:flex">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={navLinkClass(item.active)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
            <div
              id={SHELL_ACTIONS_ID}
              className="flex items-center gap-1.5 sm:gap-2"
            />
            <UserMenu user={user} settingsHref={`/${teamSlug}/settings`} />
          </div>
        </div>

        <nav className="scrollbar-none flex gap-1 overflow-x-auto px-3 pb-2 sm:px-6 md:hidden">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-md px-2 py-1 text-[12px] whitespace-nowrap",
                item.active ? "bg-muted font-medium" : "text-muted-foreground"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="min-w-0 flex-1 px-3 py-5 sm:px-6 sm:py-6">
        {children}
      </main>

      {createOpen ? (
        <CreateTeamDialog onClose={() => setCreateOpen(false)} />
      ) : null}
    </div>
  );
}

function navLinkClass(active: boolean) {
  return cn(
    "rounded-md px-2.5 py-1 text-[13px] transition-colors",
    active
      ? "bg-muted font-medium text-foreground"
      : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
  );
}

function orgNavActive(pathname: string, href: string, teamSlug: string) {
  if (href === `/${teamSlug}`) {
    return pathname === href || pathname === `/${teamSlug}/new`;
  }
  if (href.endsWith("/catalog")) {
    return pathname.startsWith(`/${teamSlug}/catalog`);
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function TeamSwitcher({
  org,
  orgs,
  onCreate,
}: {
  org: OrganizationSummary;
  orgs: OrganizationSummary[];
  onCreate: () => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleSwitch(next: OrganizationSummary) {
    if (next.id === org.id || pending) return;
    setPending(true);
    try {
      const { error } = await authClient.organization.setActive({
        organizationId: next.id,
      });
      if (error) return;
      router.push(`/${next.slug}`);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            disabled={pending}
            className="inline-flex h-8 max-w-28 min-w-0 items-center gap-1.5 rounded-lg px-1.5 text-left outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 sm:max-w-40 sm:gap-2 md:max-w-52"
          />
        }
      >
        <TeamMark name={org.name} size={22} />
        <span className="min-w-0 truncate text-[13px] font-medium">
          {org.name}
        </span>
        <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-60 p-1">
        <p className="px-2 py-1.5 text-[11px] font-medium text-muted-foreground">
          Teams
        </p>
        {orgs.map((item) => (
          <DropdownMenuItem
            key={item.id}
            onClick={() => void handleSwitch(item)}
            className="gap-2 py-1.5"
          >
            <TeamMark name={item.name} size={22} />
            <span className="min-w-0 flex-1">
              <span className="block truncate">{item.name}</span>
              <span className="block truncate font-mono text-[10px] text-muted-foreground">
                {item.slug}
              </span>
            </span>
            {item.id === org.id ? (
              <Check className="size-3.5 text-foreground" />
            ) : null}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onCreate} className="gap-2 py-1.5">
          <span className="inline-flex size-[22px] items-center justify-center rounded-[6px] border border-dashed border-foreground/25">
            <Plus className="size-3" />
          </span>
          Create team
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AgentSwitcher({
  teamSlug,
  current,
  agents,
}: {
  teamSlug: string;
  current: AgentListItem;
  agents: AgentListItem[];
}) {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="inline-flex h-8 max-w-28 min-w-0 items-center gap-1.5 rounded-lg px-1.5 text-left outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring sm:max-w-44 sm:gap-2 md:max-w-56"
          />
        }
      >
        <AgentMark name={current.name} size={20} />
        <span className="min-w-0 truncate text-[13px] font-medium">
          {current.name}
        </span>
        <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-64 p-1">
        <p className="px-2 py-1.5 text-[11px] font-medium text-muted-foreground">
          Agents
        </p>
        {agents.map((agent) => (
          <DropdownMenuItem
            key={agent.id}
            onClick={() => router.push(`/${teamSlug}/agents/${agent.id}`)}
            className="gap-2 py-1.5"
          >
            <AgentMark name={agent.name} size={22} />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5">
                <span className="truncate">{agent.name}</span>
                <StatusDot status={agent.status} />
              </span>
              <span className="block truncate text-[10px] text-muted-foreground">
                {statusLabel[agent.status]} · {agent.slug}
              </span>
            </span>
            {agent.id === current.id ? (
              <Check className="size-3.5 text-foreground" />
            ) : null}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href={`/${teamSlug}/new`} />}>
          <span className="inline-flex size-[22px] items-center justify-center rounded-lg border border-dashed border-foreground/25">
            <Plus className="size-3" />
          </span>
          New agent
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function CreateTeamDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleCreate() {
    const next = name.trim();
    if (!next || pending) return;
    setPending(true);
    setError(null);
    const base = slugifyTeamName(next);
    const slug = `${base}-${crypto.randomUUID().slice(0, 6)}`;

    try {
      const { data, error: createError } = await authClient.organization.create(
        {
          name: next,
          slug,
        }
      );
      if (createError || !data) {
        setError(createError?.message ?? "Could not create team.");
        setPending(false);
        return;
      }
      await authClient.organization.setActive({ organizationId: data.id });
      onClose();
      router.push(`/${data.slug}`);
      router.refresh();
    } catch {
      setError("Could not create team.");
      setPending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <form
        className="relative w-full max-w-sm rounded-xl border border-border bg-popover p-4 shadow-lg"
        onSubmit={(event) => {
          event.preventDefault();
          void handleCreate();
        }}
      >
        <p className="text-[14px] font-medium">Create a team</p>
        <p className="mt-1 text-[12px] text-muted-foreground">
          Agents, secrets and members stay inside the team you pick.
        </p>
        <input
          autoFocus
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Acme"
          className={cn(inputClass, "mt-4")}
        />
        {error ? (
          <p className="mt-2 text-[12px] text-red-600 dark:text-red-400">
            {error}
          </p>
        ) : null}
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-8 rounded-lg px-3 text-[13px] text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            Cancel
          </button>
          <PrimaryButton type="submit" disabled={!name.trim() || pending}>
            {pending ? "Creating…" : "Create team"}
          </PrimaryButton>
        </div>
      </form>
    </div>
  );
}

function UserMenu({
  user,
  settingsHref,
}: {
  user: ShellUser;
  settingsHref: string;
}) {
  const router = useRouter();
  const label = user.name || user.email || "Account";

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/sign-in");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={label}
        render={
          <button
            type="button"
            className="rounded-full outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring"
          />
        }
      >
        <UserAvatar name={label} size={28} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-52">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <UserAvatar name={label} size={32} />
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium">{label}</p>
            <p className="truncate text-[11px] text-muted-foreground">
              {user.email}
            </p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href={settingsHref} />}>
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => void handleSignOut()}>
          <LogOut className="size-3.5" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
