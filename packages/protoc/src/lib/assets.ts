import type { GithubReleaseAsset } from "./github";
import { unzipSync } from "fflate";
import { dirname, join } from "node:path";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
} from "node:fs";

export type ProtocAsset = {
  name: string; // e.g. protoc-31.1-linux-aarch_64.zip
  /**
   * Download-link to the asset.
   *
   * e.g. https://github.com/protocolbuffers/protobuf/releases/download/v31.1/protoc-31.1-linux-aarch_64.zip
   */
  browser_download_url: string;
  /**
   * Node.js platform.
   */
  platform: "darwin" | "linux" | "win32";
  /**
   * Node.js architecture.
   */
  arch:
    | "arm"
    | "arm64"
    | "ia32"
    | "mips"
    | "mipsel"
    | "ppc"
    | "ppc64"
    | "s390"
    | "s390x"
    | "x32"
    | "x64";
  /**
   * Unique name for the executable, e.g. bin/protoc-linux-aarch_64.
   */
  executable: string;
};

export function writeAssets(assets: ProtocAsset[], rootDir: string): void {
  writeFileSync(
    join(rootDir, "assets.json"),
    JSON.stringify(assets, undefined, 2),
  );
}

export function readAssets(rootDir: string): ProtocAsset[] {
  const text = readFileSync(join(rootDir, "assets.json"), "utf-8");
  return JSON.parse(text) as ProtocAsset[];
}

/**
 * Filters release assets from https://github.com/protocolbuffers/protobuf
 * Platform and architecture are derived from the asset's name.
 */
export function protocAssets(assets: GithubReleaseAsset[]): ProtocAsset[] {
  const mapping: Record<
    string,
    {
      platform: ProtocAsset["platform"];
      arch: ProtocAsset["arch"];
      dotExe: boolean;
    }
  > = {
    "osx-aarch_64": {
      platform: "darwin",
      arch: "arm64",
      dotExe: false,
    },
    "osx-x86_64": {
      platform: "darwin",
      arch: "x64",
      dotExe: false,
    },
    "linux-x86_64": {
      platform: "linux",
      arch: "x64",
      dotExe: false,
    },
    // "linux-x86_32": {
    //     platform: "linux",
    //     arch: "x32",
    //     dotExe: false,
    // },
    "linux-aarch_64": {
      platform: "linux",
      arch: "arm64",
      dotExe: false,
    },
    win64: {
      platform: "win32",
      arch: "x64",
      dotExe: true,
    },
    // "win32": {
    //     platform: "win32",
    //     arch: "x32", // | ia32
    //     dotExe: true,
    // },
  };
  const re = /protoc-\d+.\d+-([a-z0-9_-]+).zip/;
  const filtered: ProtocAsset[] = [];
  for (const asset of assets) {
    if (asset.content_type !== "application/zip") {
      continue;
    }
    const match = asset.name.match(re);
    if (!match) {
      continue;
    }
    const build = match[1];
    const info = mapping[build];
    if (!info) {
      continue;
    }
    filtered.push({
      name: asset.name,
      browser_download_url: asset.browser_download_url,
      ...info,
      executable: `protoc-${build}${info.dotExe ? ".exe" : ""}`,
    });
  }
  return filtered;
}

/**
 * Extract protoc from a release asset.
 */
export function extractExecutable(
  zip: Uint8Array,
  asset: ProtocAsset,
  rootDir: string,
): void {
  const unzipped = unzipSync(zip, {
    filter: (file) => file.name.startsWith("bin/protoc"),
  });
  const unzippedPaths = Object.keys(unzipped);
  if (unzippedPaths.length !== 1) {
    throw new Error("Did not find bin/protoc* in archive");
  }
  const content = unzipped[unzippedPaths[0]];
  const targetPath = join(rootDir, join("bin", asset.executable));
  if (!existsSync(dirname(targetPath))) {
    mkdirSync(dirname(targetPath), { recursive: true });
  }
  writeFileSync(targetPath, content);
  chmodSync(targetPath, 0o755);
}

/**
 * Extract proto files (include/**\/*.proto) from a release asset.
 */
export function extractInclude(zip: Uint8Array, rootDir: string): void {
  const unzipped = unzipSync(zip, {
    filter: (file) =>
      file.name.startsWith("include/") && file.name.endsWith(".proto"),
  });
  for (const [path, content] of Object.entries(unzipped)) {
    const filePath = join(rootDir, path);
    if (!existsSync(dirname(filePath))) {
      mkdirSync(dirname(filePath), { recursive: true });
    }
    writeFileSync(filePath, content);
  }
}
