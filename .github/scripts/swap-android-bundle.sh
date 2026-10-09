#!/usr/bin/env bash
# Usage: swap-android-bundle.sh <source.apk> <index.android.bundle> <output.apk>
# Signs with KEYSTORE_PATH, KEY_ALIAS, KEYSTORE_PASSWORD and KEY_PASSWORD from the environment.
set -euo pipefail

source_apk=$1
bundle=$2
output_apk=$3

build_tools="$ANDROID_HOME/build-tools/$(ls "$ANDROID_HOME/build-tools" | sort -V | tail -n 1)"
work_dir=$(mktemp -d)

mkdir -p "$work_dir/assets"
cp "$bundle" "$work_dir/assets/index.android.bundle"
cp "$source_apk" "$work_dir/unaligned.apk"
(cd "$work_dir" && zip -q -0 unaligned.apk assets/index.android.bundle)

"$build_tools/zipalign" -p -f 4 "$work_dir/unaligned.apk" "$work_dir/aligned.apk"
"$build_tools/apksigner" sign \
	--ks "$KEYSTORE_PATH" \
	--ks-key-alias "$KEY_ALIAS" \
	--ks-pass env:KEYSTORE_PASSWORD \
	--key-pass env:KEY_PASSWORD \
	--out "$output_apk" \
	"$work_dir/aligned.apk"
"$build_tools/apksigner" verify "$output_apk"
