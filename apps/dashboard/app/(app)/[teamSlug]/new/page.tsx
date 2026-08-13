import { Suspense } from "react";
import { CreateAgentForm } from "@/components/create-agent-form";
import { requireTeam } from "@/lib/team";

export default async function NewAgentPage({
  params,
}: {
  params: Promise<{ teamSlug: string }>;
}) {
  const { teamSlug } = await params;
  await requireTeam(teamSlug);

  return (
    <Suspense>
      <CreateAgentForm teamSlug={teamSlug} />
    </Suspense>
  );
}
