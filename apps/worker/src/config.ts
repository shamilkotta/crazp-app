export function resolveDispatchWorker(env: CloudflareEnv, workerName: string) {
  const namespace = env.DISPATCH_NAMESPACE?.trim();
  if (!namespace) {
    throw new Error("DISPATCH_NAMESPACE is not configured.");
  }

  const baseUrl = env.DISPATCH_WORKER_BASE_URL?.trim();
  if (!baseUrl) {
    return { namespace, workerUrl: undefined };
  }

  const origin = new URL(
    baseUrl.includes("://") ? baseUrl : `https://${baseUrl}`
  );
  return {
    namespace,
    workerUrl: `${origin.protocol}//${workerName}.${origin.host}`,
  };
}

export function resolveR2S3Credentials(env: CloudflareEnv) {
  if (
    !env.R2_ACCESS_KEY_ID ||
    !env.R2_SECRET_ACCESS_KEY ||
    !env.R2_BUCKET_NAME
  ) {
    throw new Error(
      "Missing R2 S3 credentials. Set R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME in apps/worker/.dev.vars (local) or via `wrangler secret put` (deployed)."
    );
  }
  return {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    bucketName: env.R2_BUCKET_NAME,
  };
}
