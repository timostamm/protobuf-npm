import type { GithubRelease } from "./github";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

type PackageJson = {
  name: string;
  version: string;
  upstreamVersion: string;
};

/**
 * Reads a package.json file.
 */
export function readPackageJson(path: string): PackageJson {
  const pkg = JSON.parse(readFileSync(path, "utf-8"));
  if ("upstreamVersion" in pkg && typeof pkg.upstreamVersion === "string") {
    return pkg as PackageJson;
  }
  throw new Error(`Missing upstreamVersion in package.json`);
}

/**
 * Write package.json file to rootDir.
 */
export function writePackageJson(rootDir: string, pkg: PackageJson): void {
  writeJson(join(rootDir, "package.json"), pkg);
}

/**
 * Update the version in package.json, and the references in the
 * nearest package-lock.json.
 */
export function updatePackageVersions(
  release: GithubRelease,
  pkg: PackageJson,
  lock?: Lockfile,
): void {
  // Update version in package
  pkg.version = createPackageVersion(release, pkg.version);
  pkg.upstreamVersion = release.tag_name;
  // Update references in lock-file
  if (lock) {
    findLockPackage(lock, pkg.name).version = pkg.version;
    for (const lockPkg of Object.values(lock.packages)) {
      updatePackageDep(lockPkg, pkg.name, pkg.version);
    }
  }
}

/**
 * Create a package version like 31.1.0 from:
 * - The major and minor version an upstream release, e.g., `31.1` from `v31.1`.
 * - The patch version of current package version, e.g., `2` from `30.0.2`.
 */
function createPackageVersion(
  release: GithubRelease,
  currentVersion: string,
): string {
  const tagNameRe = /^v(\d+)\.(\d+)(?:-(rc\d))?$/;
  const tagNameMatch = release.tag_name.match(tagNameRe);
  if (!tagNameMatch) {
    throw new Error(
      `Unexpected tag_name "${release.tag_name}" for GitHub ${release.prerelease ? "prerelease" : "release"} "${release.name}"`,
    );
  }
  const [, major, minor, prerelease] = tagNameMatch;
  if (release.prerelease !== !!prerelease) {
    throw new Error(
      `Unexpected tag_name "${release.tag_name}" for GitHub ${release.prerelease ? "prerelease" : "release"} "${release.name}"`,
    );
  }
  const currentVersionMatch = currentVersion.match(/^\d+\.\d+\.(\d+)/);
  if (!currentVersionMatch) {
    throw new Error(`Unexpected currentVersion "${currentVersion}"`);
  }
  const patch = currentVersionMatch[1];
  if (release.prerelease) {
    return `${major}.${minor}.${patch}-${prerelease}`;
  }
  return `${major}.${minor}.${patch}`;
}

type Lockfile = {
  packages: Record<string, LockPackage>;
};

type LockPackage = {
  name?: string;
  version?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
};

export function readLockfile(path: string): Lockfile {
  const lock = JSON.parse(readFileSync(path, "utf-8"));
  if (typeof lock !== "object" || lock === null) {
    throw new Error(`Failed to parse ${path}`);
  }
  if (
    !("lockfileVersion" in lock) ||
    (lock.lockfileVersion !== 2 && lock.lockfileVersion !== 3)
  ) {
    throw new Error(`Unsupported lock file version in ${path}`);
  }
  if (typeof lock.packages !== "object" || lock.packages == null) {
    throw new Error(`Missing "packages" in ${path}`);
  }
  return lock;
}

/**
 * Write package-lock.json file.
 */
export function writeLockFile(lock: Lockfile, path: string): void {
  writeJson(path, lock);
}

/**
 * Locates an entry for a local workspace package in a lock file.
 * Throws an error if not found.
 */
function findLockPackage(lock: Lockfile, packageName: string): LockPackage {
  for (const [path, lockPkg] of Object.entries(lock.packages)) {
    if ("name" in lockPkg && lockPkg.name === packageName) {
      return lockPkg;
    }
    // In some situations, the entry for a local package doesn't have a "name" property.
    // We check the path of the entry instead: If the last path element is the same as
    // the package name without scope, it's the entry we are looking for.
    if (path.startsWith("node_modules/")) {
      // Not a local workspace package
      continue;
    }
    const lastPathEle = path.split("/").pop();
    const packageShortname = packageName.split("/").pop();
    if (lastPathEle === packageShortname) {
      return lockPkg;
    }
  }
  throw new Error(
    `Cannot find package ${packageName} in lock file. Run npm install?`,
  );
}

function updatePackageDep(
  pkg: LockPackage,
  depName: string,
  toVersion: string,
): { pkg: LockPackage; message: string }[] {
  const log: { pkg: LockPackage; message: string }[] = [];
  for (const key of [
    "dependencies",
    "devDependencies",
    "peerDependencies",
    "optionalDependencies",
  ] as const) {
    const deps = pkg[key];
    if (!deps) {
      continue;
    }
    const from = deps?.[depName];
    if (from === undefined) {
      continue;
    }
    let to: string;
    if (from.startsWith("^")) {
      to = `^${toVersion}`;
    } else if (from.startsWith("~")) {
      to = `~${toVersion}`;
    } else if (from.startsWith("=")) {
      to = `=${toVersion}`;
    } else if (from === "*") {
      to = `*`;
    } else {
      to = toVersion;
    }
    if (from === to) {
      continue;
    }
    deps[depName] = to;
    log.push({
      pkg,
      message: `updated ${key}["${depName}"] from ${from} to ${to}`,
    });
  }
  return log;
}

export function writeJson(path: string, json: unknown) {
  writeFileSync(path, `${JSON.stringify(json, null, 2)}\n`);
}
