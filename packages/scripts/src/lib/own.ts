import { dirname, join } from "node:path";
import { existsSync } from "node:fs";
import type { GithubRelease } from "./github";
import type { PackageJson } from "./package";
import {
  filterSupportedUpstreamReleases,
  parseUpstreamVersionFromTag,
} from "./upstream";

export type OwnVersion = {
  product: "protoc" | "conformance";
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
};

/**
 * Parse a version of a github.com/timostamm/protobuf-npm release tag name.
 */
export function parseOwnVersionFromTag(
  tag_name: string,
): OwnVersion | undefined {
  const tagNameRe =
    /^(protoc|protobuf-conformance)\/v(\d+)\.(\d+)\.(\d+)(?:-(rc\d))?$/;
  const match = tag_name.match(tagNameRe);
  if (!match) {
    return undefined;
  }
  const [, product, major, minor, patch, prerelease] = match;
  return {
    product: product === "protoc" ? "protoc" : "conformance",
    major: parseInt(major, 10),
    minor: parseInt(minor, 10),
    patch: parseInt(patch, 10),
    prerelease:
      prerelease !== undefined && prerelease.length > 0
        ? prerelease
        : undefined,
  };
}

export function findFreeVersion(
  product: "protoc" | "conformance",
  upstreamRelease: GithubRelease,
  ownReleases: GithubRelease[],
): string {
  const free = findFreeOwnVersion(product, upstreamRelease, ownReleases);
  return free.prerelease
    ? `${free.major}.${free.minor}.${free.patch}-${free.prerelease}`
    : `${free.major}.${free.minor}.${free.patch}`;
}

function findFreeOwnVersion(
  product: "protoc" | "conformance",
  upstreamRelease: GithubRelease,
  ownReleases: GithubRelease[],
): OwnVersion {
  const upstreamVersion = parseUpstreamVersionFromTag(upstreamRelease.tag_name);
  if (!upstreamVersion) {
    throw new Error(
      `Unexpected tag_name "${upstreamRelease.tag_name}" for GitHub ${upstreamRelease.prerelease ? "prerelease" : "release"} "${upstreamRelease.name}"`,
    );
  }
  const free: OwnVersion = {
    product,
    major: upstreamVersion.major,
    minor: upstreamVersion.minor,
    patch: 0,
    prerelease: upstreamVersion.prerelease,
  };
  const highestTaken = filterSupportedOwnReleases(ownReleases)
    .map((release) => parseOwnVersionFromTag(release.tag_name))
    .filter((version) => version !== undefined)
    .filter((version) => version.product === product)
    .filter((version) => version.major === upstreamVersion.major)
    .filter((version) => version.minor === upstreamVersion.minor)
    .filter((version) => version.prerelease === upstreamVersion.prerelease)
    .sort((a, b) => a.patch - b.patch)
    .pop();
  if (highestTaken) {
    free.patch = highestTaken.patch + 1;
  }
  return free;
}

type OwnMissing = {
  upstream: GithubRelease;
  missingProtoc: boolean;
  missingConformance: boolean;
};

/**
 * Find missing own releases for upstream releases.
 */
export function findOwnMissing(
  upstreamReleases: GithubRelease[],
  ownReleases: GithubRelease[],
): OwnMissing[] {
  upstreamReleases = filterSupportedUpstreamReleases(upstreamReleases);
  ownReleases = filterSupportedOwnReleases(ownReleases);
  const missing: OwnMissing[] = [];
  for (const upstreamRelease of upstreamReleases) {
    const upstreamVersion = parseUpstreamVersionFromTag(
      upstreamRelease.tag_name,
    );
    if (!upstreamVersion) {
      continue;
    }
    const ownVersions = ownReleases
      .map((release) => parseOwnVersionFromTag(release.tag_name))
      .filter((version) => version !== undefined)
      .filter(
        (version) =>
          version.major === upstreamVersion.major &&
          version.minor === upstreamVersion.minor &&
          version.prerelease === upstreamVersion.prerelease,
      );
    const missingProtoc = ownVersions.every(
      (version) => version.product !== "protoc",
    );
    const missingConformance = ownVersions.every(
      (version) => version.product !== "conformance",
    );
    if (!missingProtoc && !missingConformance) {
      continue;
    }
    missing.push({
      upstream: upstreamRelease,
      missingProtoc,
      missingConformance,
    });
  }
  return missing;
}

/**
 * Parse a version of a package.json.
 */
export function parseOwnVersionFromPkg(
  pkg: PackageJson,
): OwnVersion | undefined {
  const re = /^(\d+)\.(\d+)\.(\d+)(?:-(rc\d))?$/;
  const match = pkg.version.match(re);
  if (!match) {
    return undefined;
  }
  const [, major, minor, patch, prerelease] = match;
  return {
    product: pkg.name === "protoc" ? "protoc" : "conformance",
    major: parseInt(major, 10),
    minor: parseInt(minor, 10),
    patch: parseInt(patch, 10),
    prerelease:
      prerelease !== undefined && prerelease.length > 0
        ? prerelease
        : undefined,
  };
}

export function filterSupportedOwnReleases(
  releases: GithubRelease[],
): GithubRelease[] {
  return releases
    .filter((release) => !release.draft)
    .filter((release) => {
      const version = parseOwnVersionFromTag(release.tag_name);
      return version !== undefined && version.major >= 26;
    });
}

/**
 * Get the local root directory of the project.
 */
export function findRootDir() {
  const name = "package-lock.json";
  let path = join(__dirname, name);
  while (!existsSync(path)) {
    if (path.length < name.length + 2) {
      throw new Error(`Can't find ${name} when walking up from ${__dirname}`);
    }
    path = join(dirname(path), "../", name);
  }
  return dirname(path);
}
