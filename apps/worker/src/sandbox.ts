import {
  getSandbox as getSandboxBase,
  Sandbox as BaseSandbox,
  ContainerProxy,
} from "@cloudflare/sandbox";
import crazpCoreTarball from "./vendor/crazp-core";

export class Sandbox extends BaseSandbox {
  // Keep general egress off; allowlisted HTTPS must be intercepted or TLS
  // never reaches the Worker proxy (ECONNRESET to registry.npmjs.org).
  enableInternet = false;
  interceptHttps = true;
  allowedHosts = [
    "registry.npmjs.org",
    "registry.npmjs.com",
    "*.npmjs.org",
    "*.npmjs.com",
    "api.cloudflare.com",
    "registry.cloudflare.com",
    "docker.io",
    "*.docker.io",
    "*.docker.com",
  ];
}

Sandbox.outboundByHost = {
  "api.cloudflare.com": (
    request: Request,
    env: { CLOUDFLARE_API_TOKEN?: string }
  ) => {
    if (!env.CLOUDFLARE_API_TOKEN) {
      return new Response("Cloudflare API token is not configured.", {
        status: 500,
      });
    }

    const headers = new Headers(request.headers);
    headers.delete("Authorization");
    headers.set("Authorization", `Bearer ${env.CLOUDFLARE_API_TOKEN.trim()}`);
    return fetch(request, { headers });
  },
};

export { ContainerProxy };

export function getSandbox(
  env: { SANDBOX: DurableObjectNamespace<Sandbox> },
  deploymentId: string
) {
  return getSandboxBase<Sandbox>(env.SANDBOX, `crazp-${deploymentId}`);
}

export async function prewarmSandbox(
  env: { SANDBOX: DurableObjectNamespace<Sandbox> },
  deploymentId: string
) {
  const sandbox = getSandbox(env, deploymentId);
  console.info("prewarm: waiting for sandbox packages, wrangler, and docker");

  await Promise.all([
    ensureLocalPackages(
      sandbox,
      "crazp",
      crazpCoreTarball,
      "/workspace/vendor/crazp"
    ),
    ensureWrangler(sandbox),
    ensureDocker(sandbox),
  ]);
  console.info("prewarm: sandbox ready");
}

async function ensureWrangler(sandbox: Sandbox) {
  const version = await sandbox.exec("wrangler --version", { timeout: 30_000 });
  if (!version.success) {
    throw new Error(
      `Wrangler is not available in the build sandbox:\n${version.stderr || version.stdout}`
    );
  }
}

async function ensureDocker(sandbox: Sandbox) {
  let version = await sandbox.exec("docker version", { timeout: 10_000 });
  if (!version.success && isMissingDockerSocket(version)) {
    await startDockerDaemon(sandbox);
    version = await waitForDocker(sandbox);
  }

  if (!version.success) {
    const detail = await describeDockerFailure(sandbox, version);
    throw new Error(`Docker is not available in the build sandbox:\n${detail}`);
  }
}

async function startDockerDaemon(sandbox: Sandbox) {
  const processes = await sandbox.listProcesses();
  const bootScript = "/home/rootless/boot-docker.sh";
  const existing = processes.find(
    (process) =>
      process.command.includes(bootScript) &&
      (process.status === "starting" || process.status === "running")
  );
  if (existing) return;

  const start = await sandbox.startProcess(`sh ${shellQuote(bootScript)}`, {
    processId: `docker-daemon-${Date.now()}`,
    autoCleanup: false,
  });
  console.info("prewarm: started docker daemon", {
    processId: start.id,
    status: start.status,
  });
}

async function waitForDocker(sandbox: Sandbox) {
  let last = await sandbox.exec("docker version", { timeout: 10_000 });
  for (let attempt = 0; attempt < 60 && !last.success; attempt += 1) {
    await sleep(500);
    last = await sandbox.exec("docker version", { timeout: 10_000 });
  }
  return last;
}

async function describeDockerFailure(
  sandbox: Sandbox,
  version: { stdout: string; stderr: string }
) {
  const processes = await sandbox.listProcesses();
  const bootProcesses = processes.filter((process) =>
    process.command.includes("/home/rootless/boot-docker.sh")
  );
  const logs = await Promise.all(
    bootProcesses.map(async (process) => {
      const output = await sandbox.getProcessLogs(process.id);
      return [
        `process ${process.id} (${process.status})`,
        output.stdout,
        output.stderr,
      ]
        .filter(Boolean)
        .join("\n");
    })
  );

  return [
    version.stderr || version.stdout,
    logs.length > 0 ? `Docker startup logs:\n${logs.join("\n---\n")}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

function isMissingDockerSocket(result: { stdout: string; stderr: string }) {
  const output = `${result.stdout}\n${result.stderr}`;
  return (
    output.includes("Cannot connect to the Docker daemon") ||
    output.includes("failed to connect to the docker API") ||
    output.includes("/var/run/docker.sock") ||
    output.includes("docker.sock: connect: no such file or directory")
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureLocalPackages(
  sandbox: Sandbox,
  packageName: string,
  tarball: ArrayBuffer,
  packageDir: string
) {
  const markerPath = `${packageDir}/package.json`;
  const existing = await sandbox.exec(`test -f ${shellQuote(markerPath)}`);
  if (existing.success) return;

  const encodedPath = `/workspace/vendor/${packageName}.tgz.b64`;
  const tarballPath = `/workspace/vendor/${packageName}.tgz`;
  await sandbox.mkdir(packageDir, { recursive: true });
  await sandbox.writeFile(encodedPath, arrayBufferToBase64(tarball));
  const unpack = await sandbox.exec(
    [
      "node -e",
      shellQuote(
        `const fs=require("node:fs");fs.writeFileSync(${JSON.stringify(tarballPath)}, Buffer.from(fs.readFileSync(${JSON.stringify(encodedPath)}, "utf8"), "base64"));`
      ),
      "&&",
      "tar -xzf",
      shellQuote(tarballPath),
      "-C",
      shellQuote(packageDir),
      "--strip-components=1",
    ].join(" ")
  );
  if (!unpack.success) {
    throw new Error(
      `Failed to unpack ${packageName} package in sandbox:\n${unpack.stderr || unpack.stdout}`
    );
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

function shellQuote(value: string) {
  return `'${value.replaceAll("'", "'\\''")}'`;
}
