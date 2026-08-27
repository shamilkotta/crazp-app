import { cache } from "react";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createDb, type Database } from "@workspace/db";

export const getDb = cache((): Database => {
  const ctx = getCloudflareContext();
  return createDb(ctx.env.DATABASE);
});
