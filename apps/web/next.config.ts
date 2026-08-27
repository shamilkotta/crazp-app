import type { NextConfig } from "next";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

const nextConfig: NextConfig = {
  transpilePackages: ["@workspace/ui", "@workspace/db"],
  turbopack: {
    root: workspaceRoot,
  },
};

export default nextConfig;

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

if (process.env.NODE_ENV === "development") {
  void initOpenNextCloudflareForDev({
    // Share local D1 with dashboard / worker
    persist: { path: "../dashboard/.wrangler/state/v3" },
  });
}
