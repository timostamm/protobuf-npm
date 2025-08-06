#!/usr/bin/env tsx

import { join } from "node:path";
import { fetchGithubRelease } from "./lib/github";
import { type PackageJson, readPackageJson } from "./lib/package";
import { findRootDir } from "./lib/root";

const usage = `USAGE: checkversion.ts protoc|conformance

Outputs:
- package_version: Version from the local package.json.
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
  const package_upstream_is_latest = latestRelease.tag_name === pkg.upstreamVersion;
  console.log(`package_version=${pkg.version}`);
  console.log(`package_upstream_version=${pkg.upstreamVersion}`);
  console.log(`latest_upstream_version=${latestRelease.tag_name}`);
  console.log(`package_upstream_is_latest=${package_upstream_is_latest ? "1" : ""}`);
}
