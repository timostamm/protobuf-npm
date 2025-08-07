protobuf-conformance
====================

This package provides the Protobuf conformance test runner `conformance_test_runner` <!-- inject: release.tag_name -->v26.0<!-- end -->.

```shell script
npm install --save-dev protobuf-conformance
npx conformance_test_runner --help 
```

This is an unofficial distribution of the test runner from https://github.com/protocolbuffers/protobuf/tree/main/conformance.

### Test protos

The protocol for the conformance suite is defined in a Protobuf file, and it uses
Protobuf files for testing. This package ships all relevant Protobuf files in the
`include` directory. The files can be copied elsewhere with the command `conformance_proto_eject`:

```shell script
npm install --save-dev protobuf-conformance
npx conformance_proto_eject ./target-dir
```