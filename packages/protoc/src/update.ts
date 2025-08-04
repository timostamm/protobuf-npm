import { dirname, join } from "node:path";
import { rmSync } from "node:fs";
import { fetchGithubRelease } from "./lib/github";
import {
  extractExecutable,
  extractInclude,
  protocAssets,
  writeAssets,
} from "./lib/protoc-assets";
import { updateReadme } from "./lib/readme";
import {
  readPackageJson,
  readNearestLockfile,
  updatePackageVersions,
  writePackageJson,
  writeLockFile,
} from "./lib/package";

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
const rootDir = __dirname.endsWith("src") ? dirname(__dirname) : __dirname;

void main(process.argv.slice(2));

async function main(args: string[]): Promise<void> {
  if (args.length !== 1) {
    console.error(usage);
    process.exit(1);
  }
  const pkg = readPackageJson(rootDir);
  const [lock, lockPath] = readNearestLockfile(rootDir);

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
  rmSync(join(rootDir, "bin"), { recursive: true, force: true });
  rmSync(join(rootDir, "include"), { recursive: true, force: true });
  rmSync(join(rootDir, "assets.json"), { recursive: true, force: true });

  // fetch assets
  console.log(`Fetching ${assets.length} supported assets...`);
  const zips = await Promise.all(
    assets.map(async (asset) => {
      const res = await fetch(asset.browser_download_url);
      const zip = new Uint8Array(await res.arrayBuffer());
      extractExecutable(zip, asset, rootDir);
      return zip;
    }),
  );
  extractInclude(zips[0], rootDir);
  writeAssets(assets, rootDir);

  // update package.json and others
  updatePackageVersions(release, pkg, lock);
  console.log(`Update package version to ${pkg.version}...`);
  writePackageJson(rootDir, pkg);
  writeLockFile(lock, lockPath);
  updateReadme(release, rootDir);

  console.log("Done");
}
