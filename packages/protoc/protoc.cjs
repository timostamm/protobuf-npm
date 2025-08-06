#!/usr/bin/env node
"use strict";

// src/protoc.ts
var import_node_path = require("node:path");
var import_node_child_process = require("node:child_process");
var import_node_fs = require("node:fs");
var rootDir = __dirname.endsWith("src") ? (0, import_node_path.dirname)(__dirname) : __dirname;
var assets = JSON.parse(
  (0, import_node_fs.readFileSync)((0, import_node_path.join)(rootDir, "assets.json"), "utf-8")
);
var asset = assets.find(
  (asset2) => asset2.arch === process.arch && asset2.platform === process.platform
);
if (!asset) {
  throw new Error(
    `No protoc executable available for your platform (${process.platform}) and architecture (${process.arch})`
  );
}
var command = (0, import_node_path.join)(rootDir, "bin", asset.executable);
var p = (0, import_node_child_process.spawnSync)(command, process.argv.slice(2), {
  stdio: "inherit"
});
if (p.error !== void 0) {
  throw p.error;
}
process.exit(p.status ?? 0);
