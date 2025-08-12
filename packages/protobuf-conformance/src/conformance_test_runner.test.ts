import { spawnSync } from "node:child_process";
import { suite, test } from "node:test";
import * as assert from "node:assert";

void suite("conformance_test_runner", () => {
  test("--foo", () => {
    const ret = spawnSync("conformance_test_runner", ["--foo"], {
      stdio: "pipe",
      encoding: "utf8",
    });
    assert.strictEqual(ret.status, 1);
    assert.strictEqual(ret.stderr.includes("Unknown option: --foo"), true);
  });
});
