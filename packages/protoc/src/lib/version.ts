import type { GithubRelease } from "./github";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";

/**
 * Create a package version like 31.1.0 from:
 * - The major and minor version an upstream release, e.g., `31.1` from `v31.1`.
 * - The patch version of current package version, e.g., `2` from `30.0.2`.
 */
export function createPackageVersion(
  release: GithubRelease,
  currentVersion: string,
): string {
  const tagNameMatch = release.tag_name.match(/v(\d+)\.(\d+)/);
  if (!tagNameMatch) {
    throw new Error(
      `Unexpected tag_name "${release.tag_name}" for GitHub release "${release.name}"`,
    );
  }
  const [, major, minor] = tagNameMatch;
  const currentVersionMatch = currentVersion.match(/\d+\.\d+\.(\d+)/);
  if (!currentVersionMatch) {
    throw new Error(`Unexpected currentVersion "${currentVersion}"`);
  }
  const patch = currentVersionMatch[1];
  return `${major}.${minor}.${patch}`;
}

/**
 * Reads the version from package.json.
 */
export function readPackageVersion(rootDir: string): string {
  const packagePath = join(rootDir, "package.json");
  const pkg = readPackageJson(packagePath);
  return pkg.version;
}

/**
 * Update the version in package.json, and the references in the
 * nearest package-lock.json.
 */
export function updatePackageVersion(version: string, rootDir: string): void {
  // Update version in package
  const packagePath = join(rootDir, "package.json");
  const pkg = readPackageJson(packagePath);
  pkg.version = version;
  writeJson(packagePath, pkg);

  // Update references in lock-file
  const [lock, lockPath] = findNearestLockfile(rootDir);
  findLockPackage(lock, "@protobuf-ts/protoc").version = version;
  for (const lockPkg of Object.values(lock.packages)) {
    updatePackageDep(lockPkg, pkg.name, version);
  }
  writeJson(lockPath, lock);
}

type PackageJson = {
  name: string;
  version: string;
};

/**
 * Reads a package.json file.
 */
function readPackageJson(path: string): PackageJson {
  return JSON.parse(readFileSync(path, "utf-8")) as PackageJson;
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

function findNearestLockfile(rootPath: string): [Lockfile, string] {
  const name = "package-lock.json";
  let path = join(rootPath, name);
  while (!existsSync(path)) {
    if (path.length < name.length + 2) {
      throw new Error(`Can't find ${name} when walking up from ${rootPath}`);
    }
    path = join(dirname(path), "../", name);
  }
  return [readLockfile(path), path];
}

function readLockfile(path: string): Lockfile {
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

function writeJson(path: string, json: unknown) {
  writeFileSync(path, `${JSON.stringify(json, null, 2)}\n\n`);
}
