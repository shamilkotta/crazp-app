import { getSandbox, Sandbox } from "./sandbox";

const SOURCE_MOUNT = "/workspace/r2/source";
const BUILD_MOUNT = "/workspace/r2/build";

export async function buildWithCrazp(
  env: { SANDBOX: DurableObjectNamespace<Sandbox>; LOCAL_DEV?: string },
  deploymentId: string,
  sourcePrefix: string,
  outputPrefix: string
) {
  const sandbox = getSandbox(env, deploymentId);
  const workdir = `/workspace/crazp/${deploymentId}`;
  await sandbox.mkdir(workdir, { recursive: true });

  // Local Docker containers do not expose /dev/fuse, so s3fs mounts fail with
  // "fuse: device not found". Use sync-based localBucket mounts under wrangler
  // dev; production keeps the real FUSE mount path.
  const localBucket = env.LOCAL_DEV === "true";

  // Mount inputs read-only so the sandbox cannot tamper with source state.
  // Mount outputs writeable so we don't need to stream build artifacts through the worker.
  await Promise.all([
    safeUnmountBucket(sandbox, SOURCE_MOUNT),
    safeUnmountBucket(sandbox, BUILD_MOUNT),
  ]);

  await Promise.all([
    sandbox.mountBucket("AGENT_DEPLOYMENT_BUCKET", SOURCE_MOUNT, {
      prefix: `/${sourcePrefix}/`,
      readOnly: true,
      localBucket: localBucket || undefined,
    }),
    sandbox.mountBucket("AGENT_DEPLOYMENT_BUCKET", BUILD_MOUNT, {
      prefix: `/${outputPrefix}/`,
      localBucket: localBucket || undefined,
    }),
  ]);

  await Promise.all([
    sandbox.writeFile(`${workdir}/setup.js`, setupProjectScript(sourcePrefix)),
    sandbox.writeFile(`${workdir}/build.mjs`, buildProjectScript()),
  ]);

  const setup = await sandbox.exec("node setup.js", { cwd: workdir });
  if (!setup.success) {
    throw new Error(
      `Sandbox project setup failed:\n${setup.stderr || setup.stdout}`
    );
  }

  const install = await sandbox.exec("pnpm install --ignore-scripts", {
    cwd: workdir,
  });
  if (!install.success) {
    throw new Error(
      `Sandbox dependency install failed:\n${install.stderr || install.stdout}`
    );
  }

  const build = await sandbox.exec("node build.mjs", { cwd: workdir });
  if (!build.success) {
    throw new Error(`Sandbox build failed:\n${build.stderr || build.stdout}`);
  }

  const config = await sandbox.readFile(`${BUILD_MOUNT}/output.json`, {
    encoding: "utf8",
  });
  if (!config.success) {
    throw new Error(`Failed to read build output: ${config.exitCode}`);
  }
  const metadata = JSON.parse(config.content);
  return metadata;
}

async function safeUnmountBucket(sandbox: Sandbox, mountPath: string) {
  try {
    await sandbox.unmountBucket(mountPath);
  } catch {
    // Ignore if it was not mounted in a previous failed run.
  }
}

function setupProjectScript(sourcePrefix: string) {
  return `import { dirname, join } from "node:path";
import { readFile, writeFile, copyFile, mkdir } from "node:fs/promises";

const sourceDir = "${SOURCE_MOUNT}";

const input = JSON.parse(await readFile("${SOURCE_MOUNT}/source.json", "utf8"));
const projectRoot = process.cwd();
await mkdir(projectRoot, { recursive: true });
for (const file of input.files) {
  const outputPath = join(projectRoot, normalizeBuildPath(file.path));
  await mkdir(dirname(outputPath), { recursive: true });
  if(file.content) {
    await writeFile(outputPath, file.content);
  } else if (file.key) {
    const resoucePath = file.key.replace("${sourcePrefix}", sourceDir);
    await copyFile(resoucePath, outputPath);
  }
}

function normalizeBuildPath(path) {
  const normalized = path.replace(/\\\\/g, "/").replace(/^\\/+/, "");
  if (normalized.split("/").includes("..")) {
    throw new Error("Invalid source path: " + path);
  }
  return normalized;
}

  `;
}

function buildProjectScript() {
  return `import { join } from "node:path";
import { writeFile } from "node:fs/promises";
import { buildAgent } from "@crazp/core/build";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const projectRoot = process.cwd();
const output = await buildAgent({ projectRoot });
await writeFile(
  "build-metadata.json",
  JSON.stringify({ wranglerConfig: output.wranglerConfig }, null, 2),
);

await writeFile(
  "${BUILD_MOUNT}/output.json",
  JSON.stringify(
    {
      version: 1,
      artifact: { contentType: "application/gzip", format: "tar.gz" },
      wranglerConfig: output.wranglerConfig ?? null,
    },
    null,
    2,
  ),
);

await execFileAsync("tar", [
  "-czf",
  "${BUILD_MOUNT}/output.tar.gz",
  "-C",
  ".crazp/output",
  ".",
]);


`;
}
