#!/bin/bash
set -euo pipefail

module_dir="$(cd "$(dirname "$0")/.." && pwd)"
rust_dir="$module_dir/rust"
output_dir="$rust_dir/target/apple/$PLATFORM_NAME"
library_name="librocketchat_message_parser_ffi.a"

export PATH="${CARGO_HOME:-$HOME/.cargo}/bin:$PATH"
unset SDKROOT

linker_platform_for() {
	case "$PLATFORM_NAME" in
		iphoneos) echo ios ;;
		iphonesimulator) echo ios-simulator ;;
		*)
			echo "error: no linker platform for $PLATFORM_NAME" >&2
			exit 1
			;;
	esac
}

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

exported_symbols=(_rocketchat_message_parser_parse _rocketchat_message_parser_free)
linker_symbol_flags=()
for symbol in "${exported_symbols[@]}"; do
	linker_symbol_flags+=(-u "$symbol" -exported_symbol "$symbol")
done

linker_platform="$(linker_platform_for)"

mkdir -p "$output_dir"
libraries=()
for arch in $ARCHS; do
	rust_target="$(rust_target_for "$arch")"
	(cd "$rust_dir" && cargo build --release --locked --target "$rust_target" --target-dir "$rust_dir/target")
	prelinked_object="$output_dir/rocketchat_message_parser_ffi-$arch.o"
	xcrun ld -r -arch "$arch" -platform_version "$linker_platform" "$IPHONEOS_DEPLOYMENT_TARGET" 0 \
		"${linker_symbol_flags[@]}" "$rust_dir/target/$rust_target/release/$library_name" -o "$prelinked_object"
	xcrun libtool -static -o "$output_dir/$arch-$library_name" "$prelinked_object"
	libraries+=("$output_dir/$arch-$library_name")
done

lipo -create "${libraries[@]}" -output "$output_dir/$library_name"
