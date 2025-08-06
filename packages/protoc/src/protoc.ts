#!/usr/bin/env node

import { join, dirname } from "node:path";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

/*
This script is a shim for `protoc`. It reads assets.json to find a binary for the current
platform and architecture, and executes it, delegating arguments and std io.
*/
const rootDir = __dirname.endsWith("src") ? dirname(__dirname) : __dirname;
const assets = JSON.parse(
  readFileSync(join(rootDir, "assets.json"), "utf-8"),
) as { arch: string; platform: string; executable: string }[];
const asset = assets.find(
  (asset) => asset.arch === process.arch && asset.platform === process.platform,
);
if (!asset) {
  throw new Error(
    `No protoc executable available for your platform (${process.platform}) and architecture (${process.arch})`,
  );
}
const command = join(rootDir, "bin", asset.executable);
const p = spawnSync(command, process.argv.slice(2), {
  stdio: "inherit",
});
if (p.error !== undefined) {
  throw p.error;
}
process.exit(p.status ?? 0);
