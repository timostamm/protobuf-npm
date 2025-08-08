#!/usr/bin/env tsx

import { join, normalize } from "node:path";
import { rmSync } from "node:fs";
import { fetchGithubRelease, listGithubReleases } from "./lib/github";
import {
  extractExecutable,
  extractInclude,
  protocAssets,
  writeAssets,
} from "./lib/upstream";
import { updateReadme } from "./lib/readme";
import {
  readLockfile,
  readPackageJson,
  updatePackageVersions,
  writeJson,
} from "./lib/package";
import { findFreeVersion, findRootDir } from "./lib/own";

const usage = `USAGE: update.ts 31.1|latest|current

This script looks up a release of https://github.com/protocolbuffers/protobuf,
and downloads release assets.

Assets are protoc archives for several combinations of platform and architecture. 
They are downloaded and extracted to the directories 'bin' and 'include'. 
The list of assets is written to 'assets.json'.

.
├── assets.json
├── bin
│   ├── protoc-linux-aarch_64
│   ├── protoc-linux-x86_64
│   ├── protoc-osx-aarch_64
│   ├── protoc-osx-x86_64
│   └── protoc-win64.exe
└── include
    └── google
        └── protobuf
            └── *.proto
`;

void main(process.argv.slice(2));

async function main(args: string[]): Promise<void> {
  if (args.length !== 1) {
    console.error(usage);
    process.exit(1);
  }
  const pkgDir = join(findRootDir(), "packages/protoc");
  const pkgPath = join(pkgDir, "package.json");
  const lockPath = normalize(join(pkgDir, "../../package-lock.json"));
  const pkg = readPackageJson(pkgPath);
  const lock = readLockfile(lockPath);

  // fetch release
  const release = await fetchGithubRelease(
    "protocolbuffers",
    "protobuf",
    args[0] === "current" ? pkg.upstreamVersion : args[0],
  );
  const assets = protocAssets(release.assets);
  console.log(
    `Found GitHub release ${release.name} (${release.tag_name}) with ${release.assets.length} assets.`,
  );
  if (assets.length === 0) {
    console.log("No supported assets found");
    process.exit(1);
  }

  // clean
  rmSync(join(pkgDir, "bin"), { recursive: true, force: true });
  rmSync(join(pkgDir, "include"), { recursive: true, force: true });
  rmSync(join(pkgDir, "assets.json"), { recursive: true, force: true });

  // fetch assets
  console.log(`Fetching ${assets.length} supported assets...`);
  const zips = await Promise.all(
    assets.map(async (asset) => {
      const res = await fetch(asset.browser_download_url);
      const zip = new Uint8Array(await res.arrayBuffer());
      extractExecutable(zip, asset, pkgDir);
      return zip;
    }),
  );
  extractInclude(zips[0], pkgDir);
  writeAssets(assets, pkgDir);

  // update package.json and others
  const freeVersion = findFreeVersion(
    "protoc",
    release,
    await listGithubReleases("timostamm", "protobuf-npm"),
  );
  console.log(`Update package version to ${freeVersion}...`);
  updatePackageVersions(freeVersion, release.tag_name, pkg, lock);
  writeJson(pkgPath, pkg);
  writeJson(lockPath, lock);
  updateReadme(join(pkgDir, "README.md"), release);

  console.log("Done");
}
