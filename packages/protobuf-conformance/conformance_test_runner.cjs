#!/usr/bin/env node
"use strict";

// src/conformance_test_runner.ts
var import_node_path = require("node:path");
var import_node_fs = require("node:fs");
var import_node_child_process = require("node:child_process");
var rootDir = __dirname.endsWith("src") ? (0, import_node_path.dirname)(__dirname) : __dirname;
var binPath = (0, import_node_path.join)(
  rootDir,
  "bin",
  `conformance_test_runner-${process.platform}-${process.arch}`
);
if (!(0, import_node_fs.existsSync)(binPath)) {
  if (process.platform === "darwin" && process.arch === "arm64") {
    binPath = (0, import_node_path.join)(
      rootDir,
      "bin",
      `conformance_test_runner-${process.platform}-x64`
    );
  }
  if (!(0, import_node_fs.existsSync)(binPath)) {
    throw new Error(
      `No conformance_test_runner executable available for your platform (${process.platform}) and architecture (${process.arch})`
    );
  }
}
var p = (0, import_node_child_process.spawnSync)(binPath, process.argv.slice(2), {
  stdio: "inherit"
});
if (p.error !== void 0) {
  throw p.error;
}
process.exit(p.status ?? 0);
