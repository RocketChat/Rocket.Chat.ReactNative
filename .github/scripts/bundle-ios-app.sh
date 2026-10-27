#!/usr/bin/env bash
# Usage: bundle-ios-app.sh <path/to/App.app>
set -euo pipefail

app_dir=$(cd "$1" && pwd)
repo_root=$(cd "$(dirname "$0")/../.." && pwd)

rm -rf "$app_dir/assets" "$app_dir/main.jsbundle"

CONFIGURATION=Release \
	PLATFORM_NAME=iphonesimulator \
	CONFIGURATION_BUILD_DIR=$(dirname "$app_dir") \
	UNLOCALIZED_RESOURCES_FOLDER_PATH=$(basename "$app_dir") \
	PROJECT_DIR="$repo_root/ios" \
	NODE_BINARY=$(command -v node) \
	HERMES_CLI_PATH="$repo_root/node_modules/hermes-compiler/hermesc/osx-bin/hermesc" \
	"$repo_root/node_modules/react-native/scripts/react-native-xcode.sh"

rm "$(dirname "$app_dir")/main.jsbundle"
codesign --force --sign - --preserve-metadata=identifier,entitlements,flags "$app_dir"
