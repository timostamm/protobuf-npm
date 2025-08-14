import { spawnSync } from "node:child_process";
import { suite, test } from "node:test";
import * as assert from "node:assert";
import { readFileSync } from "node:fs";

void suite("protoc", () => {
  test("--version", () => {
    const ret = spawnSync("protoc", ["--version"], {
      stdio: "pipe",
      encoding: "utf8",
    });
    assert.strictEqual(ret.status, 0);
    console.log({ stdout: ret.stdout, exp: getExpectedVersion() });
    const actual = ret.stdout.trim();
    const expected = getExpectedVersion();
    assert.ok(
      actual.includes(expected),
      `Reported "${actual}" does not include expected "${expected}"`,
    );
  });
});

function getExpectedVersion() {
  const raw = JSON.parse(readFileSync("./package.json", { encoding: "utf8" }))
    .upstreamVersion as string;
  const match = raw.match(/^v(\d+\.\d+(?:-rc\d)?)$/);
  if (!match) {
    throw new Error(`Unknown upstreamVersion: ${raw}`);
  }
  let version = match[1];
  if (version.startsWith("21.")) {
    // All v21.x releases report the version number 3.21.x
    version = `3.${version}`;
  }
  return version;
}
