import { getCloudflareContext } from "@opennextjs/cloudflare";
import { initAuth, type Auth, type AuthEnv } from "@workspace/auth";

export function getAuth(): Auth {
  const ctx = getCloudflareContext();
  return initAuth({
    env: ctx.env as AuthEnv,
    cf: ctx.cf,
  });
}
