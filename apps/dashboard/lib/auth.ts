import { cache } from "react";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { initAuth, type Auth, type AuthEnv } from "@workspace/auth";

export function createAuth(): Auth {
  const ctx = getCloudflareContext();
  return initAuth({
    env: ctx.env as AuthEnv,
    cf: ctx.cf,
  });
}

export const getAuth = cache(createAuth);
