#!/usr/bin/env node
"use strict";

// src/conformance_proto_eject.ts
var import_node_path = require("node:path");
var import_node_fs = require("node:fs");
var usage = `USAGE: conformance_proto_eject target-directory

This command writes conformance test protos to the given target directory.
`;
void main(process.argv.slice(2));
async function main(args) {
  if (args.length !== 1) {
    console.error(usage);
    process.exit(1);
  }
  const sourceDir = (0, import_node_path.join)(
    __dirname.endsWith("src") ? (0, import_node_path.dirname)(__dirname) : __dirname,
    "include"
  );
  const targetDir = args[0];
  let filesWritten = 0;
  for (const relPath of (0, import_node_fs.readdirSync)(sourceDir, {
    withFileTypes: false,
    recursive: true,
    encoding: "utf8"
  })) {
    if (!relPath.endsWith(".proto")) {
      continue;
    }
    const sourcePath = (0, import_node_path.join)(sourceDir, relPath);
    const targetPath = (0, import_node_path.join)(targetDir, relPath);
    if (!(0, import_node_fs.existsSync)((0, import_node_path.dirname)(targetPath))) {
      (0, import_node_fs.mkdirSync)((0, import_node_path.dirname)(targetPath), { recursive: true });
    }
    (0, import_node_fs.copyFileSync)(sourcePath, targetPath);
    filesWritten++;
  }
  console.log(
    `Wrote ${filesWritten} conformance test proto files to "${targetDir}".`
  );
}
