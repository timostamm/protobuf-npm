import { dirname, join } from "node:path";
import { existsSync } from "node:fs";

/**
 * Get the local root directory of the project.
 */
export function findRootDir() {
  const name = "package-lock.json";
  let path = join(__dirname, name);
  while (!existsSync(path)) {
    if (path.length < name.length + 2) {
      throw new Error(`Can't find ${name} when walking up from ${__dirname}`);
    }
    path = join(dirname(path), "../", name);
  }
  return dirname(path);
}
