#!/usr/bin/env node

import { join, dirname } from "node:path";
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

/*
This script is a shim for `conformance_test_runner`. It locates a binary for the current
platform and architecture in bin, and executes it, delegating arguments and std io.
*/
const rootDir = __dirname.endsWith("src") ? dirname(__dirname) : __dirname;
let binPath = join(
  rootDir,
  "bin",
  `conformance_test_runner-${process.platform}-${process.arch}`,
);
if (!existsSync(binPath)) {
  if (process.platform === "darwin" && process.arch === "arm64") {
    binPath = join(
      rootDir,
      "bin",
      `conformance_test_runner-${process.platform}-x64`,
    );
  }
  if (!existsSync(binPath)) {
    throw new Error(
      `No conformance_test_runner executable available for your platform (${process.platform}) and architecture (${process.arch})`,
    );
  }
}
const p = spawnSync(binPath, process.argv.slice(2), {
  stdio: "inherit",
});
if (p.error !== undefined) {
  throw p.error;
}
process.exit(p.status ?? 0);
