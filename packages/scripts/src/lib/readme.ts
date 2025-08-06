import type { GithubRelease } from "./github";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Update the upstream release version in README.md.
 */
export function updateReadme(release: GithubRelease, rootDir: string): void {
  const path = join(rootDir, "README.md");
  writeFileSync(
    path,
    readFileSync(path, "utf-8").replace(
      /<!-- inject: release.tag_name -->(.+)<!-- end -->/,
      `<!-- inject: release.tag_name -->${release.tag_name}<!-- end -->`,
    ),
  );
}

/**
 * Update the upstream release version in README.md.
 */
export function updateReadme2(path: string, release: GithubRelease): void {
  writeFileSync(
    path,
    readFileSync(path, "utf-8").replace(
      /<!-- inject: release.tag_name -->(.+)<!-- end -->/,
      `<!-- inject: release.tag_name -->${release.tag_name}<!-- end -->`,
    ),
  );
}
