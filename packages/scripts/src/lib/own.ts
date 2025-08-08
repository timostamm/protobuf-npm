import { dirname, join } from "node:path";
import { existsSync } from "node:fs";
import type { GithubRelease } from "./github";
import type { PackageJson } from "./package";

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

export function filterOwnReleases(
  releases: GithubRelease[],
  filter: {
    product?: "protoc" | "conformance";
    major?: number;
    minor?: number;
    patch?: number;
    prerelease?: string;
  },
) {
  return releases.filter((release) => {
    const version = parseOwnVersionFromTag(release.tag_name);
    if (!version) {
      return false;
    }
    if (filter.product !== undefined && filter.product !== version.product) {
      return false;
    }
    if (filter.major !== undefined && filter.major !== version.major) {
      return false;
    }
    if (filter.minor !== undefined && filter.minor !== version.minor) {
      return false;
    }
    if (filter.patch !== undefined && filter.patch !== version.patch) {
      return false;
    }
    if (
      filter.prerelease !== undefined &&
      filter.prerelease !== version.prerelease
    ) {
      return false;
    }
    return true;
  });
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
