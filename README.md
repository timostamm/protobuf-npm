This project provides unofficial npm packages for https://github.com/protocolbuffers/protobuf.

## protoc

[![NPM Version](https://img.shields.io/npm/v/protoc/latest?color=green&label=protoc)](https://www.npmjs.com/package/protoc)

This package provides the Protobuf compiler `protoc`.

```shell script
npm install --save-dev protoc
npx protoc --version 
```

### Migrating from version 1.1.3 and earlier

The package used to provide a JavaScript API to generate JavaScript code.
This API is no longer available, since `protoc` does not generate JavaScript code
without an external plugin anymore. You can continue to run the compiler with 
`npx protoc`.

### Migrating from @protobuf-ts/protoc

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

### Test protos

The protocol for the conformance suite is defined in a Protobuf file, and it uses
Protobuf files for testing. This package ships all relevant Protobuf files in the
`include` directory. The files can be copied elsewhere with the command `conformance_proto_eject`:

```shell script
npm install --save-dev protobuf-conformance
npx conformance_proto_eject ./target-dir
```