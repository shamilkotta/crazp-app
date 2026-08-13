"use client";

import { useEffect, useState } from "react";

import { authClient } from "@workspace/auth/client";
import type { OrganizationSummary } from "@/lib/organization";
import {
  Empty,
  Field,
  PrimaryButton,
  Surface,
  inputClass,
} from "@/components/board/ui";
import { cn } from "@workspace/ui/lib/utils";

const settingsSections = [
  { key: "general", label: "General", blurb: "Name and slug" },
  { key: "members", label: "Members", blurb: "Who can see and change agents" },
  { key: "secrets", label: "Secrets", blurb: "Keys your agents borrow" },
  { key: "keys", label: "API keys", blurb: "How your code calls agents" },
  { key: "usage", label: "Usage", blurb: "Runs, tokens and spend" },
] as const;

type Section = (typeof settingsSections)[number]["key"];

type MemberRow = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export function SettingsView({
  organization,
}: {
  organization: OrganizationSummary;
}) {
  const [section, setSection] = useState<Section>("general");
  const [orgName, setOrgName] = useState(organization.name);
  const [invite, setInvite] = useState("");
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadMembers() {
      try {
        const result = await authClient.organization.listMembers({
          query: { organizationId: organization.id },
        });
        if (cancelled) return;
        if (result.error) {
          setMembersError(result.error.message ?? "Could not load members.");
          return;
        }
        const rows = (result.data?.members ?? []).map((member) => ({
          id: member.id,
          name: member.user.name || member.user.email,
          email: member.user.email,
          role: member.role,
        }));
        setMembers(rows);
      } catch {
        if (!cancelled) {
          setMembersError("Could not load members.");
        }
      }
    }
    void loadMembers();
    return () => {
      cancelled = true;
    };
  }, [organization.id]);

  async function saveGeneral() {
    const next = orgName.trim();
    if (!next || pending) return;
    setPending(true);
    setSaved(false);
    try {
      const { error } = await authClient.organization.update({
        data: { name: next },
        organizationId: organization.id,
      });
      if (error) {
        setPending(false);
        return;
      }
      setSaved(true);
    } finally {
      setPending(false);
    }
  }

  async function sendInvite() {
    if (!invite.includes("@") || pending) return;
    setPending(true);
    setInviteError(null);
    try {
      const { error } = await authClient.organization.inviteMember({
        email: invite.trim(),
        role: "member",
        organizationId: organization.id,
      });
      if (error) {
        setInviteError(error.message ?? "Could not send invite.");
        return;
      }
      setInvite("");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr] lg:gap-8">
      <nav className="scrollbar-none -mx-3 flex gap-1 overflow-x-auto px-3 sm:-mx-6 sm:px-6 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
        {settingsSections.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setSection(item.key)}
            className={cn(
              "flex shrink-0 flex-col rounded-xl px-3 py-2 text-left lg:w-full lg:py-2.5",
              section === item.key
                ? "bg-muted"
                : "text-muted-foreground hover:bg-muted/50"
            )}
          >
            <span className="font-medium text-foreground">{item.label}</span>
            <span className="hidden text-[11px] lg:block">{item.blurb}</span>
          </button>
        ))}
      </nav>

      <div>
        {section === "general" ? (
          <div className="flex max-w-md flex-col gap-4">
            <Field label="Organization name">
              <input
                value={orgName}
                onChange={(event) => {
                  setOrgName(event.target.value);
                  setSaved(false);
                }}
                className={inputClass}
              />
            </Field>
            <Field label="Slug">
              <input
                value={organization.slug}
                readOnly
                className={inputClass}
              />
            </Field>
            <div className="flex items-center gap-3">
              <PrimaryButton
                onClick={() => void saveGeneral()}
                disabled={pending || !orgName.trim()}
              >
                {pending ? "Saving…" : "Save"}
              </PrimaryButton>
              {saved ? (
                <span className="text-[12px] text-muted-foreground">Saved</span>
              ) : null}
            </div>
          </div>
        ) : null}

        {section === "members" ? (
          <div className="flex flex-col gap-4">
            <form
              className="flex flex-col gap-2 sm:flex-row"
              onSubmit={(event) => {
                event.preventDefault();
                void sendInvite();
              }}
            >
              <input
                value={invite}
                onChange={(event) => setInvite(event.target.value)}
                placeholder="email@company.com"
                className={cn(inputClass, "w-full sm:max-w-xs")}
              />
              <PrimaryButton
                type="submit"
                disabled={!invite.includes("@") || pending}
              >
                Invite
              </PrimaryButton>
            </form>
            {inviteError ? (
              <p className="text-[12px] text-red-600 dark:text-red-400">
                {inviteError}
              </p>
            ) : null}
            {membersError ? (
              <p className="text-[13px] text-muted-foreground">
                {membersError}
              </p>
            ) : members.length === 0 ? (
              <Surface>
                <Empty
                  title="No members listed"
                  body="Invites go out by email. You are already in this team."
                />
              </Surface>
            ) : (
              <Surface>
                {members.map((member, index) => (
                  <div
                    key={member.id}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3",
                      index < members.length - 1 && "border-b border-border"
                    )}
                  >
                    <span className="flex size-7 items-center justify-center rounded-full bg-muted text-[11px] font-medium">
                      {member.name.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{member.name}</p>
                      <p className="truncate text-[12px] text-muted-foreground">
                        {member.email} · {member.role}
                      </p>
                    </div>
                  </div>
                ))}
              </Surface>
            )}
          </div>
        ) : null}

        {section === "secrets" ? (
          <Surface>
            <Empty
              title="No org secrets yet"
              body="A secret store for keys your agents share is not wired up. Install credentials on each listing for now."
            />
          </Surface>
        ) : null}

        {section === "keys" ? (
          <p className="max-w-lg text-[13px] text-muted-foreground">
            Agent API keys will live on each agent&apos;s Distribute page, so a
            leaked key only affects that agent. Org-level secrets are on the
            Secrets tab.
          </p>
        ) : null}

        {section === "usage" ? (
          <Surface>
            <Empty
              title="Usage is not metered yet"
              body="When agents start running, this tab will show runs, tokens and spend for the team."
            />
          </Surface>
        ) : null}
      </div>
    </div>
  );
}
