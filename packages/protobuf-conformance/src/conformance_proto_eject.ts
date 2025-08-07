#!/usr/bin/env node

import { dirname, join } from "node:path";
import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";

const usage = `USAGE: conformance_proto_eject target-directory

This command writes conformance test protos to the given target directory.
`;

void main(process.argv.slice(2));

async function main(args: string[]): Promise<void> {
  if (args.length !== 1) {
    console.error(usage);
    process.exit(1);
  }
  const sourceDir = join(
    __dirname.endsWith("src") ? dirname(__dirname) : __dirname,
    "include",
  );
  const targetDir = args[0];
  let filesWritten = 0;
  for (const relPath of readdirSync(sourceDir, {
    withFileTypes: false,
    recursive: true,
    encoding: "utf8",
  })) {
    if (!relPath.endsWith(".proto")) {
      continue;
    }
    const sourcePath = join(sourceDir, relPath);
    const targetPath = join(targetDir, relPath);
    if (!existsSync(dirname(targetPath))) {
      mkdirSync(dirname(targetPath), { recursive: true });
    }
    copyFileSync(sourcePath, targetPath);
    filesWritten++;
  }
  console.log(
    `Wrote ${filesWritten} conformance test proto files to "${targetDir}".`,
  );
}
