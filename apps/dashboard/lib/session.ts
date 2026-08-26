import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getAuth } from "@/lib/auth";

export const getSession = cache(async () => {
  const auth = getAuth();
  return auth.api.getSession({
    headers: await headers(),
  });
});

export const requireSession = cache(async () => {
  const session = await getSession();
  if (!session) {
    redirect("/sign-in");
  }
  return session;
});
