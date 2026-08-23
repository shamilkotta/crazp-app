const WORKER_NAME_RE = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const IPV4_RE = /^(?:\d{1,3}\.){3}\d{1,3}$/;

export default {
  async fetch(request, env): Promise<Response> {
    const workerName = workerNameFromHostname(new URL(request.url).hostname);
    if (!workerName) {
      return new Response("Missing agent. Invalid request URL.", {
        status: 400,
      });
    }

    try {
      const userWorker = env.DISPATCHER.get(workerName);
      return await userWorker.fetch(request);
    } catch (error) {
      if (isWorkerNotFound(error)) {
        return new Response("Agent not found", { status: 404 });
      }
      console.error("Dispatch failed", { workerName, error });
      return new Response("Agent dispatch failed", { status: 500 });
    }
  },
} satisfies ExportedHandler<CloudflareEnv>;

function workerNameFromHostname(hostname: string) {
  const host = hostname.trim().toLowerCase();
  if (
    !host ||
    host === "localhost" ||
    host.startsWith("[") ||
    IPV4_RE.test(host)
  ) {
    return null;
  }

  const [subdomain, ...rest] = host.split(".");
  if (!subdomain || rest.length === 0 || !WORKER_NAME_RE.test(subdomain)) {
    return null;
  }

  return subdomain;
}

function isWorkerNotFound(error: unknown) {
  return error instanceof Error && error.message.startsWith("Worker not found");
}
