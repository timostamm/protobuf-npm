#!/usr/bin/env tsx

import { join } from "node:path";
import { type PackageJson, readPackageJson } from "./lib/package";
import {
  filterSupportedOwnReleases,
  findOwnMissing,
  findRootDir,
} from "./lib/own";
import { listGithubReleases } from "./lib/github";
import { filterSupportedUpstreamReleases } from "./lib/upstream";
import { appendFileSync } from "node:fs";

const usage = `USAGE: 

version.ts local protoc|conformance [--github-output "$GITHUB_OUTPUT"]

  Reads the version from package.json and outputs:
  - package_version: Version from the local package.json.
  - package_dist_tag: npm dist-tag for the local package version. E.g. "latest" for 29.2.1, and "next" for 30.2.1-rc.1. 
  - package_is_prerelease: Whether  the package_version is a prerelease version.
  - package_upstream_version: Upstream version of the local package.

version.ts missing [--github-output "$GITHUB_OUTPUT"]

  Outputs the earliest missing release for protoc, and for conformance.

version.ts list own

  List all own releases.

version.ts list upstream

  List all upstream releases.

version.ts list missing

  List all missing releases. The tag_name of the upstream release, and 
  whether "protoc" and / or the "conformance" package is missing.

`;

void main(process.argv.slice(2));

async function main(args: string[]): Promise<void> {
  switch (args.shift()) {
    case "local":
      await local(args);
      break;
    case "list":
      await list(args);
      break;
    case "missing":
      await missing(args);
      break;
    default:
      console.error(usage);
      process.exit(1);
  }
}

async function list(args: string[]): Promise<void> {
  if (args.length !== 1) {
    console.error(usage);
    process.exit(1);
  }
  switch (args[0]) {
    case "own": {
      const all = await listGithubReleases("timostamm", "protobuf-npm");
      const supported = filterSupportedOwnReleases(all);
      console.log(
        `Found ${supported.length} supported ${args[0]} releases (${all.length} total):`,
      );
      for (const release of supported) {
        console.log(release.tag_name);
      }
      break;
    }
    case "upstream": {
      const all = await listGithubReleases("protocolbuffers", "protobuf");
      const supported = filterSupportedUpstreamReleases(all);
      console.log(
        `Found ${supported.length} supported ${args[0]} releases (${all.length} total):`,
      );
      for (const release of supported) {
        console.log(release.tag_name);
      }
      break;
    }
    case "missing": {
      const ownMissing = findOwnMissing(
        await listGithubReleases("protocolbuffers", "protobuf"),
        await listGithubReleases("timostamm", "protobuf-npm"),
      );
      for (const missing of ownMissing) {
        const packages: string[] = [];
        if (missing.missingProtoc) {
          packages.push("protoc");
        }
        if (missing.missingConformance) {
          packages.push("conformance");
        }
        console.log(`${missing.upstream.tag_name}: ${packages.join(", ")}`);
      }
      break;
    }
    default:
      console.error(usage);
      process.exit(1);
  }
}

async function missing(args: string[]): Promise<void> {
  const githubOutput = parseGithubOutputArg(args);
  if (args.length !== 0) {
    console.error(usage);
    process.exit(1);
  }
  const missing = findOwnMissing(
    await listGithubReleases("protocolbuffers", "protobuf"),
    await listGithubReleases("timostamm", "protobuf-npm"),
  );
  // biome-ignore format: Don't break lines for readability
  printVars(githubOutput, {
    missing_protoc: missing.filter((miss) => miss.missingProtoc)
        .pop()?.upstream.tag_name ?? "",
    missing_conformance: missing.filter((miss) => miss.missingConformance)
        .pop()?.upstream.tag_name ?? "",
  });
}

async function local(args: string[]): Promise<void> {
  let pkg: PackageJson;
  switch (args.shift()) {
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
  const githubOutput = parseGithubOutputArg(args);
  if (args.length !== 0) {
    console.error(usage);
    process.exit(1);
  }
  const packageVersionPrerelease = pkg.version.match(
    /^\d+\.\d+\.\d+(-.+)?$/,
  )?.[1];
  // biome-ignore format: Don't break lines for readability
  printVars(githubOutput, {
    package_version: pkg.version,
    package_dist_tag: packageVersionPrerelease !== undefined ? "next" : "latest",
    package_is_prerelease: packageVersionPrerelease !== undefined ? "1" : "",
    package_upstream_version: pkg.upstreamVersion,
  });
}

function printVars(
  githubOutput: string | undefined,
  vars: Record<string, string>,
): void {
  if (githubOutput !== undefined) {
    console.log(`Github output:`);
  }
  for (const [key, val] of Object.entries(vars)) {
    console.log(`${key}=${val}`);
    if (githubOutput !== undefined) {
      appendFileSync(githubOutput, `${key}=${val}\n`);
    }
  }
}

function parseGithubOutputArg(args: string[]): string | undefined {
  switch (args.shift()) {
    case "--github-output": {
      const githubOutput = args.shift();
      if (githubOutput === undefined) {
        console.error(usage);
        process.exit(1);
      }
      return githubOutput;
    }
    case undefined:
      return undefined;
    default:
      console.error(usage);
      process.exit(1);
  }
}
