#!/bin/bash
set -euo pipefail

module_dir="$(cd "$(dirname "$0")/.." && pwd)"
rust_dir="$module_dir/rust"
output_dir="$rust_dir/target/apple/$PLATFORM_NAME"
library_name="librocketchat_message_parser_ffi.a"

export PATH="${CARGO_HOME:-$HOME/.cargo}/bin:$PATH"
unset SDKROOT

rust_target_for() {
	case "$PLATFORM_NAME/$1" in
		iphoneos/arm64) echo aarch64-apple-ios ;;
		iphonesimulator/arm64) echo aarch64-apple-ios-sim ;;
		iphonesimulator/x86_64) echo x86_64-apple-ios ;;
		*)
			echo "error: no Rust target for $PLATFORM_NAME $1" >&2
			exit 1
			;;
	esac
}

libraries=()
for arch in $ARCHS; do
	rust_target="$(rust_target_for "$arch")"
	(cd "$rust_dir" && cargo build --release --locked --target "$rust_target")
	libraries+=("$rust_dir/target/$rust_target/release/$library_name")
done

mkdir -p "$output_dir"
lipo -create "${libraries[@]}" -output "$output_dir/$library_name"
