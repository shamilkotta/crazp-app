#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const versionFile = resolve(repoRoot, "apps/worker/crazp-core.version");
const vendorDir = resolve(repoRoot, "apps/worker/src/vendor");
const buildTsPath = resolve(repoRoot, "apps/worker/src/sandbox.ts");
const siblingCoreDir = resolve(repoRoot, "../crazp/packages/core");
// packages/core lives in its own repo (submodule of crazp).
const defaultRepoUrl = "https://github.com/shamilkotta/crazp-core.git";

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    ...options,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(" ")}`);
  }

  return result;
}

function runCapture(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    ...options,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(
      `Command failed: ${command} ${args.join(" ")}\n${result.stderr || result.stdout}`,
    );
  }

  return (result.stdout || "").trim();
}

function readRequiredVersion() {
  if (!existsSync(versionFile)) {
    throw new Error(
      `Missing version pin at ${versionFile}. Add a single semver line (e.g. 0.0.2).`,
    );
  }

  const version = readFileSync(versionFile, "utf8").trim();
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
    throw new Error(
      `Invalid crazp core version "${version}" in ${versionFile}`,
    );
  }

  return version;
}

function readPackageJson(packageDir) {
  return JSON.parse(readFileSync(join(packageDir, "package.json"), "utf8"));
}

function assertLocalVersion(coreDir, version) {
  const localVersion = readPackageJson(coreDir).version;
  if (localVersion !== version) {
    throw new Error(
      `Local @crazp/core at ${coreDir} is ${localVersion}, but crazp-core.version pins ${version}`,
    );
  }
}

/**
 * Prefer a local checkout when not in CI:
 * - CRAZP_CORE_DIR=/path/to/packages/core
 * - or sibling ../crazp/packages/core when its package.json version matches the pin
 *
 * CI / CRAZP_VENDOR_FORCE_CLONE=1 always clones the tagged release instead.
 */
function resolveLocalCoreDir(version) {
  if (process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true") {
    return null;
  }

  if (process.env.CRAZP_VENDOR_FORCE_CLONE === "1") {
    return null;
  }

  if (process.env.CRAZP_CORE_DIR) {
    const coreDir = resolve(process.env.CRAZP_CORE_DIR);
    if (!existsSync(join(coreDir, "package.json"))) {
      throw new Error(`CRAZP_CORE_DIR has no package.json: ${coreDir}`);
    }
    assertLocalVersion(coreDir, version);
    return coreDir;
  }

  if (!existsSync(siblingCoreDir)) {
    return null;
  }

  const localVersion = readPackageJson(siblingCoreDir).version;
  if (localVersion !== version) {
    console.warn(
      `Sibling @crazp/core is ${localVersion}, requested ${version}; cloning tagged release instead.`,
    );
    return null;
  }

  return siblingCoreDir;
}

function resolveRefCommit(repoDir, version) {
  const candidates = [`v${version}`, version, `@crazp/core@${version}`];

  for (const ref of candidates) {
    const result = spawnSync(
      "git",
      ["rev-parse", "--verify", `${ref}^{commit}`],
      {
        cwd: repoDir,
        encoding: "utf8",
      },
    );
    if (result.status === 0) {
      return { ref, commit: result.stdout.trim(), via: "tag" };
    }
  }

  if (process.env.CRAZP_CORE_REQUIRE_TAGS === "1") {
    throw new Error(
      `Missing git tag v${version} in crazp-core. Create it on the release commit, then re-run.`,
    );
  }

  // Fallback: newest commit whose package.json version matches.
  console.warn(
    `No tag v${version} found; falling back to package.json history. Prefer tagging releases as v${version}.`,
  );

  const commits = runCapture(
    "git",
    ["rev-list", "HEAD", "--", "package.json"],
    {
      cwd: repoDir,
    },
  )
    .split("\n")
    .filter(Boolean);

  for (const commit of commits) {
    const raw = runCapture("git", ["show", `${commit}:package.json`], {
      cwd: repoDir,
    });
    try {
      const pkg = JSON.parse(raw);
      if (pkg.version === version) {
        return { ref: commit, commit, via: "history" };
      }
    } catch {
      // Ignore unreadable historical package.json blobs.
    }
  }

  throw new Error(
    `Could not find @crazp/core@${version} in ${repoDir}. Tag the release commit as v${version}.`,
  );
}

function resolveRepoUrl() {
  if (process.env.CRAZP_REPO_URL) {
    return process.env.CRAZP_REPO_URL;
  }

  const token =
    process.env.CRAZP_CORE_TOKEN ||
    process.env.GH_TOKEN ||
    process.env.GITHUB_TOKEN;

  if (token) {
    return `https://x-access-token:${token}@github.com/shamilkotta/crazp-core.git`;
  }

  return defaultRepoUrl;
}

function cloneCorePackage(version) {
  const repoUrl = resolveRepoUrl();
  const cloneDir = mkdtempSync(join(tmpdir(), "crazp-vendor-"));
  const tag = `v${version}`;

  // Fast path: clone the release tag directly (does not follow main HEAD).
  const tagClone = spawnSync(
    "git",
    [
      "clone",
      "--filter=blob:none",
      "--branch",
      tag,
      "--depth",
      "1",
      repoUrl,
      cloneDir,
    ],
    { encoding: "utf8" },
  );

  if (tagClone.status === 0) {
    console.log(`Cloned crazp-core@${tag} into ${cloneDir}`);
  } else {
    console.log(
      `Tag ${tag} not cloneable yet; cloning full history into ${cloneDir}`,
    );
    if (existsSync(cloneDir)) {
      rmSync(cloneDir, { recursive: true, force: true });
    }
    run("git", ["clone", "--filter=blob:none", repoUrl, cloneDir]);
    run("git", ["fetch", "--tags", "--force", "origin"], { cwd: cloneDir });

    const { ref, commit, via } = resolveRefCommit(cloneDir, version);
    console.log(
      `Checking out @crazp/core@${version} via ${via} (${ref} @ ${commit})`,
    );
    run("git", ["checkout", "--force", commit], { cwd: cloneDir });
  }

  const checkedVersion = readPackageJson(cloneDir).version;
  if (checkedVersion !== version) {
    throw new Error(
      `Checked out @crazp/core@${checkedVersion}, expected ${version}`,
    );
  }

  return { coreDir: cloneDir, cleanupDir: cloneDir };
}

/**
 * Standalone clones are not inside the crazp pnpm workspace, so rewrite
 * workspace: protocol deps to registry ranges before install/pack.
 */
function rewriteWorkspaceDependencies(coreDir) {
  const packageJsonPath = join(coreDir, "package.json");
  const pkg = readPackageJson(coreDir);
  let changed = false;

  for (const field of ["dependencies", "devDependencies", "peerDependencies"]) {
    const deps = pkg[field];
    if (!deps) continue;
    for (const [name, range] of Object.entries(deps)) {
      if (typeof range === "string" && range.startsWith("workspace:")) {
        if (name === "crazp") {
          deps[name] = process.env.CRAZP_PKG_VERSION || "^0.0.1";
        } else {
          deps[name] = range.replace(/^workspace:/, "") || "*";
        }
        changed = true;
      }
    }
  }

  if (changed) {
    writeFileSync(packageJsonPath, `${JSON.stringify(pkg, null, 2)}\n`);
    console.log("Rewrote workspace: dependencies for standalone install");
  }
}

function normalizePackedTarball(version) {
  const expectedName = `crazp-core-${version}.tgz`;
  const expectedPath = join(vendorDir, expectedName);
  if (existsSync(expectedPath)) {
    return expectedPath;
  }

  const matches = readdirSync(vendorDir).filter(
    (name) => name.endsWith(`-${version}.tgz`) && name.includes("core"),
  );

  if (matches.length === 1) {
    const from = join(vendorDir, matches[0]);
    renameSync(from, expectedPath);
    return expectedPath;
  }

  throw new Error(`Expected packed tarball at ${expectedPath}`);
}

function buildAndPack(
  coreDir,
  version,
  { install = true, standalone = false } = {},
) {
  if (standalone) {
    rewriteWorkspaceDependencies(coreDir);
  }

  if (install) {
    console.log("Installing @crazp/core dependencies");
    // pnpm 10 blocks dependency build scripts unless allowlisted; esbuild needs its postinstall.
    const npmrcPath = join(coreDir, ".npmrc");
    writeFileSync(
      npmrcPath,
      [
        "onlyBuiltDependencies[]=esbuild",
        "onlyBuiltDependencies[]=@mongodb-js/zstd",
        "onlyBuiltDependencies[]=node-liblzma",
        "",
      ].join("\n"),
    );
    run("pnpm", ["install"], {
      cwd: coreDir,
      env: { ...process.env, CI: "true" },
    });
  } else {
    // Local sibling checkout: also build the workspace crazp package first.
    const crazpPkgDir = resolve(coreDir, "../crazp");
    if (existsSync(join(crazpPkgDir, "package.json"))) {
      console.log("Building crazp package");
      run("pnpm", ["--dir", crazpPkgDir, "run", "build"]);
    }
  }

  console.log("Building @crazp/core");
  run("pnpm", ["--dir", coreDir, "run", "build"]);

  const vendorTarball = join(vendorDir, `crazp-core-${version}.tgz`);
  if (existsSync(vendorTarball)) {
    rmSync(vendorTarball);
  }

  console.log(`Packing @crazp/core@${version} -> ${vendorTarball}`);
  run("pnpm", ["--dir", coreDir, "pack", "--pack-destination", vendorDir]);
  return normalizePackedTarball(version);
}

function removeStaleTarballs(version) {
  for (const name of readdirSync(vendorDir)) {
    if (
      /^crazp-core-.*\.tgz$/.test(name) &&
      name !== `crazp-core-${version}.tgz`
    ) {
      rmSync(join(vendorDir, name));
      console.log(`Removed stale vendor tarball ${name}`);
    }
  }
}

function updateBuildImport(version) {
  const source = readFileSync(buildTsPath, "utf8");
  const nextImport = `import crazpCoreTarball from "./vendor/crazp-core-${version}.tgz";`;
  const updated = source.replace(
    /import\s+crazpCoreTarball\s+from\s+"\.\/vendor\/crazp-core-[^"]+\.tgz";/,
    nextImport,
  );

  if (updated === source && !source.includes(nextImport)) {
    throw new Error(
      `Could not update crazp core import in ${buildTsPath}. Expected an import of ./vendor/crazp-core-*.tgz`,
    );
  }

  if (updated !== source) {
    writeFileSync(buildTsPath, updated);
    console.log(`Updated ${buildTsPath} to import crazp-core-${version}.tgz`);
  }
}

function vendorTarballPath(version) {
  return join(vendorDir, `crazp-core-${version}.tgz`);
}

function shouldSkipPack(version, { hasLocalSource }) {
  if (process.env.CRAZP_VENDOR_FORCE === "1") {
    return false;
  }

  if (!existsSync(vendorTarballPath(version))) {
    return false;
  }

  // Local matching checkout: rebuild from disk so sibling edits are picked up.
  // Clone/CI path: skip when the tarball for this pin already exists.
  if (hasLocalSource) {
    return false;
  }

  return true;
}

function main() {
  if (!existsSync(vendorDir)) {
    throw new Error(`Could not find worker vendor directory at ${vendorDir}`);
  }

  const version = readRequiredVersion();
  console.log(`Vendoring @crazp/core@${version}`);

  // Resolve local first so skip/pack decisions can prefer a matching checkout.
  const localCoreDir = resolveLocalCoreDir(version);

  if (shouldSkipPack(version, { hasLocalSource: Boolean(localCoreDir) })) {
    console.log(
      `Skipping pack: ${vendorTarballPath(version)} already exists (set CRAZP_VENDOR_FORCE=1 to rebuild from clone)`,
    );
    updateBuildImport(version);
    removeStaleTarballs(version);
    console.log(`Vendored @crazp/core@${version} already up to date`);
    return;
  }

  let cleanupDir = null;
  let coreDir = localCoreDir;
  let install = true;
  let standalone = true;

  try {
    if (!coreDir) {
      const cloned = cloneCorePackage(version);
      coreDir = cloned.coreDir;
      cleanupDir = cloned.cleanupDir;
    } else {
      console.log(`Using local @crazp/core at ${coreDir}`);
      // Local sibling / CRAZP_CORE_DIR checkouts are expected to already have deps.
      install = false;
      standalone = false;
    }

    buildAndPack(coreDir, version, { install, standalone });
    removeStaleTarballs(version);
    updateBuildImport(version);
    console.log(`Vendored @crazp/core@${version} successfully`);
  } finally {
    if (cleanupDir) {
      rmSync(cleanupDir, { recursive: true, force: true });
    }
  }
}

main();
