import {
  getSandbox as getSandboxBase,
  Sandbox as BaseSandbox,
  ContainerProxy,
} from "@cloudflare/sandbox";
import crazpCoreTarball from "./vendor/crazp-core-0.1.0.tgz";

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
}

async function ensureWrangler(sandbox: Sandbox) {
  const version = await sandbox.exec("wrangler --version");
  if (!version.success) {
    throw new Error(
      `Wrangler is not available in the build sandbox:\n${version.stderr || version.stdout}`
    );
  }
}

async function ensureDocker(sandbox: Sandbox) {
  const version = await sandbox.exec(
    "sh -c 'i=0; until docker version >/dev/null 2>&1; do i=$((i+1)); [ \"$i\" -gt 75 ] && exit 1; sleep 0.2; done; docker version'"
  );
  if (!version.success) {
    throw new Error(
      `Docker is not available in the build sandbox:\n${version.stderr || version.stdout}`
    );
  }
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
