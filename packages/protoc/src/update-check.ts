import { dirname } from "node:path";
import { fetchGithubRelease } from "./lib/github";
import { readPackageJson, updatePackageVersions } from "./lib/package";

const usage = `USAGE: update-check.ts

This script checks whether a new release of https://github.com/protocolbuffers/protobuf,
is available.

It exits with code 1 if there is. Code 0 if there isn't. 
`;
const rootDir = __dirname.endsWith("src") ? dirname(__dirname) : __dirname;

void main(process.argv.slice(2));

async function main(args: string[]): Promise<void> {
  if (args.length !== 0) {
    console.error(usage);
    process.exit(1);
  }
  const release = await fetchGithubRelease(
    "protocolbuffers",
    "protobuf",
    "latest",
  );
  const pkg = readPackageJson(rootDir);
  const gotVersion = pkg.version;
  updatePackageVersions(release, pkg);
  const wantVersion = pkg.version;
  if (wantVersion === gotVersion) {
    console.log(
      `Latest GitHub release ${release.name} (${release.tag_name}) matches current version ${gotVersion}.`,
    );
    console.log(`ok=true`);
    process.exit(0);
  } else {
    console.log(
      `Latest GitHub release ${release.name} (${release.tag_name}) does not match current version ${gotVersion}.`,
    );
    console.log(`ok=false`);
    process.exit(1);
  }
}
