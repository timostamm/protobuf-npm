#!/usr/bin/env tsx

import { basename, dirname, join, normalize, matchesGlob } from "node:path";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { type Unzipped, unzipSync } from "fflate";
import { fetchGithubRelease } from "./lib/github";
import {
  readLockfile,
  readPackageJson,
  updatePackageVersions,
  writeJson,
} from "./lib/package";
import { updateReadme } from "./lib/readme";
import { findRootDir } from "./lib/own";

const usage = `USAGE: update.ts 31.1|latest|current

This script looks up a release of https://github.com/protocolbuffers/protobuf,
downloads an archive, and unpacks:
- the entire archive into .tmp/
- proto files into include/
It updates the package.json version.
`;

void main(process.argv.slice(2));

async function main(args: string[]): Promise<void> {
  if (args.length !== 1) {
    console.error(usage);
    process.exit(1);
  }
  const pkgDir = join(findRootDir(), "packages/protobuf-conformance");
  const pkgPath = join(pkgDir, "package.json");
  const pkg = readPackageJson(pkgPath);
  const lockPath = normalize(join(pkgDir, "../../package-lock.json"));
  const lock = readLockfile(lockPath);

  // fetch release and unzip in memory
  const release = await fetchGithubRelease(
    "protocolbuffers",
    "protobuf",
    args[0] === "current" ? pkg.upstreamVersion : args[0],
  );
  const asset = release.assets.find(
    (asset) =>
      asset.name.startsWith("protobuf-") && asset.name.endsWith(".zip"),
  );
  if (!asset) {
    console.log(`No supported assets found for ${release.tag_name}`);
    process.exit(1);
  }
  console.log(`Found GitHub release ${release.name} (${release.tag_name}).`);
  const res = await fetch(asset.browser_download_url);
  const unzipped = unzipSync(new Uint8Array(await res.arrayBuffer()), {
    filter: (file) => !file.name.endsWith("/"),
  });

  // write to .tmp and include
  writeTmp(join(pkgDir, ".tmp"), unzipped);
  writeInclude(join(pkgDir, "include"), unzipped);

  // update package.json and others
  updatePackageVersions(release, pkg, lock);
  console.log(`Update package version to ${pkg.version}...`);
  writeJson(pkgPath, pkg);
  writeJson(lockPath, lock);
  updateReadme(join(pkgDir, "README.md"), release);
  console.log("Done");
}

function writeTmp(tmpDir: string, unzipped: Unzipped): void {
  rmSync(tmpDir, { recursive: true, force: true });
  let filesWritten = 0;
  for (const [pathWithRoot, content] of Object.entries(unzipped)) {
    const path = pathWithRoot.split("/").slice(1).join("/");
    const target = join(tmpDir, path);
    if (!existsSync(dirname(target))) {
      mkdirSync(dirname(target), { recursive: true });
    }
    writeFileSync(target, content);
    filesWritten++;
  }
  console.log(`Unzipped ${filesWritten} files to .tmp`);
}

function writeInclude(includeDir: string, unzipped: Unzipped): void {
  // glob patterns to target directory in include dir
  const mapping = {
    "conformance/conformance.proto": "conformance/",
    "editions/golden/test_messages*.proto": "google/protobuf/",
    "conformance/test_protos/test_messages*.proto": "google/protobuf/",
    "src/google/protobuf/test_messages*.proto": "google/protobuf/",
  } satisfies Record<string, string>;
  rmSync(includeDir, { recursive: true, force: true });
  let filesWritten = 0;
  for (const [pathWithRoot, content] of Object.entries(unzipped)) {
    const path = pathWithRoot.split("/").slice(1).join("/");
    let target: string;
    for (const [pattern, targetDir] of Object.entries(mapping)) {
      if (matchesGlob(path, pattern)) {
        target = join(includeDir, targetDir, basename(path));
        if (!existsSync(dirname(target))) {
          mkdirSync(dirname(target), { recursive: true });
        }
        writeFileSync(target, content);
        filesWritten++;
      }
    }
  }
  console.log(`Unzipped ${filesWritten} files to include`);
}
