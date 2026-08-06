import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { AuthEnv } from "@workspace/auth";
import { createDb } from "@workspace/db";

export function getDb() {
  const ctx = getCloudflareContext();
  return createDb((ctx.env as AuthEnv).DATABASE);
}
