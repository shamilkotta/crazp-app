import { cache } from "react";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createDb } from "@workspace/db";

export const getDb = cache(() => {
  const ctx = getCloudflareContext();
  return createDb(ctx.env.DATABASE);
});
