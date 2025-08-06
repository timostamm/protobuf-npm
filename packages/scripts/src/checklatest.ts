#!/usr/bin/env tsx

import { join } from "node:path";
import { fetchGithubRelease } from "./lib/github";
import { type PackageJson, readPackageJson } from "./lib/package";
import { findRootDir } from "./lib/root";

const usage = `USAGE: checklatest.ts protoc|conformance

This script checks for a new upstream version: If the latest upstream release
is different from the current version of the package, it prints the new version,
for example 'latest=v23.1'. If the versions are the same, the script prints nothing.
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
  if (latestRelease.tag_name !== pkg.upstreamVersion) {
    console.log(`latest=${latestRelease.tag_name}`);
  }
}
