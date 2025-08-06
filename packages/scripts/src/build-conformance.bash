#!/usr/bin/env bash

# Install bazelisk
curl -LO "https://github.com/bazelbuild/bazelisk/releases/download/v1.16.0/bazelisk-linux-amd64"
mkdir -p "${GITHUB_WORKSPACE}/bin/"
mv bazelisk-linux-amd64 "${GITHUB_WORKSPACE}/bin/bazel"
chmod +x "${GITHUB_WORKSPACE}/bin/bazel"

# Build Binary
cd .tmp
USE_BAZEL_VERSION=7.1.2 BAZEL_CXXOPTS="-std=c++17" bazel build conformance:conformance_test_runner
