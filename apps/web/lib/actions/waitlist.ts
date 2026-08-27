"use server";

import { waitlistEntries } from "@workspace/db/schema";
import { z } from "zod";
import { getDb } from "@/lib/db";

const joinWaitlistSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(320, "Email is too long.")
    .pipe(z.email("Enter a valid email address.")),
});

export type JoinWaitlistResult =
  | { ok: true }
  | { ok: false; error: string };

export async function joinWaitlist(email: string): Promise<JoinWaitlistResult> {
  const parsed = joinWaitlistSchema.safeParse({ email });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid email address.",
    };
  }

  try {
    const db = getDb();
    await db
      .insert(waitlistEntries)
      .values({
        id: crypto.randomUUID(),
        email: parsed.data.email,
      })
      .onConflictDoNothing({ target: waitlistEntries.email });

    return { ok: true };
  } catch {
    return { ok: false, error: "Could not join the waitlist. Try again." };
  }
}
