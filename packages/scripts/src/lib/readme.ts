import type { GithubRelease } from "./github";
import { readFileSync, writeFileSync } from "node:fs";

/**
 * Update the upstream release version in README.md.
 */
export function updateReadme(path: string, release: GithubRelease): void {
  writeFileSync(
    path,
    readFileSync(path, "utf-8").replace(
      /<!-- inject: release.tag_name -->(.+)<!-- end -->/,
      `<!-- inject: release.tag_name -->${release.tag_name}<!-- end -->`,
    ),
  );
}
