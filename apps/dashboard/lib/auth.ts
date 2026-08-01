import { getCloudflareContext } from "@opennextjs/cloudflare";
import { initAuth, type Auth, type AuthEnv } from "@workspace/auth";

export async function getAuth(): Promise<Auth> {
  const ctx = await getCloudflareContext({ async: true });
  return initAuth({
    env: ctx.env as AuthEnv,
    cf: ctx.cf,
  });
}
