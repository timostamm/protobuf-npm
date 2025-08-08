#!/usr/bin/env tsx

import { join } from "node:path";
import { fetchGithubRelease } from "./lib/github";
import { type PackageJson, readPackageJson } from "./lib/package";
import { findRootDir } from "./lib/own";

const usage = `USAGE: checkversion.ts protoc|conformance

Outputs:
- package_version: Version from the local package.json.
- package_dist_tag: npm dist-tag for the local package version. E.g. "latest" for 29.2.1, and "next" for 30.2.1-rc.1. 
- package_upstream_version: Upstream version of the local package.
- latest_upstream_version: Latest upstream version.
- package_upstream_is_latest: "1" if package_upstream_version equals latest_upstream_version. 
`;

void main(process.argv.slice(2));

async function main(args: string[]): Promise<void> {
  if (args.length !== 1) {
    console.error(usage);
    process.exit(1);
  }
  let pkg: PackageJson;
  switch (args[0]) {
    case "protoc":
      pkg = readPackageJson(
        join(findRootDir(), "packages/protoc/package.json"),
      );
      break;
    case "conformance":
      pkg = readPackageJson(
        join(findRootDir(), "packages/protobuf-conformance/package.json"),
      );
      break;
    default:
      console.error(usage);
      process.exit(1);
  }
  const latestRelease = await fetchGithubRelease(
    "protocolbuffers",
    "protobuf",
    "latest",
  );
  const packageVersionPrerelease = pkg.version.match(
    /^\d+\.\d+\.\d+(-.+)?$/,
  )?.[1];
  // biome-ignore format: Don't break lines for readability
  const vars = {
    package_version: pkg.version,
    package_dist_tag: packageVersionPrerelease !== undefined ? "next" : "latest",
    package_is_prerelease: packageVersionPrerelease !== undefined ? "1" : "",
    package_upstream_version: pkg.upstreamVersion,
    latest_upstream_version: latestRelease.tag_name,
    package_upstream_is_latest: latestRelease.tag_name === pkg.upstreamVersion ? "1" : "",
  } satisfies Record<string, string>;
  for (const [key, val] of Object.entries(vars)) {
    console.log(`${key}=${val}`);
  }
}
