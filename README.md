This project provides unofficial npm packages for https://github.com/protocolbuffers/protobuf.

## protoc

[![NPM Version](https://img.shields.io/npm/v/protoc/latest?color=green&label=protoc)](https://www.npmjs.com/package/protoc)

This package provides the Protobuf compiler `protoc`.

```shell script
npm install --save-dev protoc
npx protoc --version 
```

#### Migrating from version 1.1.3 and earlier

Version 1.1.3 of this package provides `protoc` version 3.20.3, and is maintained
in https://github.com/YePpHa/node-protoc. New releases are maintained in this
repository, and version numbers match the upstream version.

Note that the JavaScript generator has been removed from `protoc` in v21.0, and
lives in a separate repository now: https://github.com/protocolbuffers/protobuf-javascript
Consequently, the package `protoc` no longer provides an API to generate JavaScript code,
but you can easily achieve the same functionality with a small function.

<details><summary>Example script to call protoc from JS</summary>

```ts
import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

function compile(files: string[]): string[] {
  const out = mkdtempSync(join(tmpdir(), "protoc-output"));
  // Just as an example, use --php_out to generate PHP code
  const ret = spawnSync(
    "protoc", ["--php_out=" + out, ...files],
    { encoding: "utf8"},
  );
  if (ret.status !== 0) {
    throw new Error(ret.stderr);
  }
  return readdirSync(out, { recursive: true, encoding: "utf8" }).filter((f) =>
    statSync(join(out, f)).isFile(),
  );
}

// Run with `npx node example.ts`
console.log(compile(["proto/msg.proto"])); // [ 'Msg.php', 'GPBMetadata/Proto/Msg.php' ]
```

</details>

#### Migrating from @protobuf-ts/protoc

The package `@protobuf-ts/protoc` also provides the Protobuf compiler. Running
`npx protoc` downloads the latest version (or a version specified in `protocVersion`
in package.json). It automatically adds `--plugin` argument for all plugins found
`in node_modules/.bin/`, and a `--proto_path` argument for `node_modules/@protobuf-ts/plugin`.

When migrating to `protoc`, you can continue to run the compiler with `npx protoc`,
but you have to provide plugins and paths yourself.


## protobuf-conformance

[![NPM Version](https://img.shields.io/npm/v/protobuf-conformance/latest?color=green&label=protobuf-conformance)](https://www.npmjs.com/package/protobuf-conformance)

This package provides the Protobuf conformance test runner `conformance_test_runner`.

```shell script
npm install --save-dev protobuf-conformance
npx conformance_test_runner --help 
```

#### Test protos

The protocol for the conformance suite is defined in a Protobuf file, and it uses
Protobuf files for testing. This package ships all relevant Protobuf files in the
`include` directory. The files can be copied elsewhere with the command `conformance_proto_eject`:

```shell script
npm install --save-dev protobuf-conformance
npx conformance_proto_eject ./target-dir
```