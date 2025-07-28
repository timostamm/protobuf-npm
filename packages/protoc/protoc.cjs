#!/usr/bin/env node
"use strict";

// src/protoc.ts
var import_node_path2 = require("node:path");

// src/lib/assets.ts
var import_node_path = require("node:path");
var import_node_fs = require("node:fs");
function readAssets(rootDir2) {
  const text = (0, import_node_fs.readFileSync)((0, import_node_path.join)(rootDir2, "assets.json"), "utf-8");
  return JSON.parse(text);
}

// src/protoc.ts
var import_node_child_process = require("node:child_process");
var rootDir = __dirname.endsWith("src") ? (0, import_node_path2.dirname)(__dirname) : __dirname;
var assets = readAssets(rootDir);
var asset = assets.find(
  (asset2) => asset2.arch === process.arch && asset2.platform === process.platform
);
if (!asset) {
  throw new Error(
    `No protoc executable available for your platform (${process.platform}) and architecture (${process.arch})`
  );
}
var command = (0, import_node_path2.join)(rootDir, "bin", asset.executable);
var p = (0, import_node_child_process.spawnSync)(command, process.argv.slice(2), {
  stdio: "inherit"
});
if (p.error !== void 0) {
  throw p.error;
}
process.exit(p.status ?? 0);
