#!/usr/bin/env tsx

import { execSync } from "node:child_process";

const gitStatusOut = execSync("git status --porcelain", {
  encoding: "utf-8",
}).trim();

if (gitStatusOut.length > 0) {
  process.stdout.write("Uncommitted changes found:\n");
  execSync("git status --porcelain", {
    stdio: "inherit",
  });
  execSync("git --no-pager diff", {
    stdio: "inherit",
  });
  process.exit(1);
}
