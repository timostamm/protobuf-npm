This project provides unofficial npm packages for https://github.com/protocolbuffers/protobuf.

TODO
- [ ] automate releases for new upstream versions
  - [x] check for new version
  - [x] open PR with changes
  - [ ] on PR merge: create GH release
  - [ ] on tag: publish to npmjs.com
    - [ ] test publish 
    - [x] use different dist tag (e.g. "next") for pre-release versions
- [ ] support RCs when checking for new versions
- [x] support RCs when updating
- [x] add the conformance runner binary


## protoc

This package provides the Protobuf compiler `protoc`.

```shell script
npm install --save-dev protoc
npx protoc --version 
```

## protobuf-conformance

This package provides the Protobuf conformance test runner `conformance_test_runner`.

```shell script
npm install --save-dev protobuf-conformance
npx conformance_test_runner --help 
```

