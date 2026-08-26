import { cache } from "react";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { AuthEnv } from "@workspace/auth";
import { createDb } from "@workspace/db";

export const getDb = cache(() => {
  const ctx = getCloudflareContext();
  return createDb((ctx.env as AuthEnv).DATABASE);
});
