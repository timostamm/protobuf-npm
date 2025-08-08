#!/usr/bin/env tsx

import { join } from "node:path";
import { type PackageJson, readPackageJson } from "./lib/package";
import { findRootDir } from "./lib/own";

const usage = `USAGE: 

version.ts local protoc|conformance

Reads the version from package.json and outputs:
- package_version: Version from the local package.json.
- package_dist_tag: npm dist-tag for the local package version. E.g. "latest" for 29.2.1, and "next" for 30.2.1-rc.1. 
- package_is_prerelease: Whether  the package_version is a prerelease version.
- package_upstream_version: Upstream version of the local package.
`;

void main(process.argv.slice(2));

async function main(args: string[]): Promise<void> {
  if (args.length === 0) {
    console.error(usage);
    process.exit(1);
  }
  switch (args.shift()) {
    case "local":
      await local(args);
      break;
    default:
      console.error(usage);
      process.exit(1);
  }
}

async function local(args: string[]) {
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
  const packageVersionPrerelease = pkg.version.match(
    /^\d+\.\d+\.\d+(-.+)?$/,
  )?.[1];
  // biome-ignore format: Don't break lines for readability
  const vars = {
    package_version: pkg.version,
    package_dist_tag: packageVersionPrerelease !== undefined ? "next" : "latest",
    package_is_prerelease: packageVersionPrerelease !== undefined ? "1" : "",
    package_upstream_version: pkg.upstreamVersion,
  } satisfies Record<string, string>;
  for (const [key, val] of Object.entries(vars)) {
    console.log(`${key}=${val}`);
  }
}
