"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Building2, ChevronsUpDown } from "lucide-react";
import { authClient } from "@workspace/auth/client";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";

export type OrganizationOption = {
  id: string;
  name: string;
  slug: string;
};

export function OrganizationSwitcher({
  organizations,
  activeOrganizationId,
  activeTeamSlug,
}: {
  organizations: OrganizationOption[];
  activeOrganizationId?: string | null;
  activeTeamSlug?: string | null;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const activeOrganization =
    organizations.find((org) => org.slug === activeTeamSlug) ??
    organizations.find((org) => org.id === activeOrganizationId) ??
    organizations[0] ??
    null;

  async function handleSwitch(organizationId: string) {
    const next = organizations.find((org) => org.id === organizationId);
    if (!next || next.id === activeOrganization?.id || pending) {
      return;
    }

    setPending(true);
    try {
      const { error } = await authClient.organization.setActive({
        organizationId: next.id,
      });
      if (error) {
        return;
      }
      router.push(`/${next.slug}`);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  if (!activeOrganization) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="max-w-56 rounded-full bg-card/70 px-3 text-muted-foreground shadow-sm"
            disabled={pending}
          />
        }
      >
        <Building2 data-icon="inline-start" />
        <span className="truncate">{activeOrganization.name}</span>
        <ChevronsUpDown data-icon="inline-end" className="opacity-50" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Organizations</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={activeOrganization.id}
            onValueChange={(value) => {
              void handleSwitch(String(value));
            }}
          >
            {organizations.map((org) => (
              <DropdownMenuRadioItem key={org.id} value={org.id}>
                <span className="truncate">{org.name}</span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
