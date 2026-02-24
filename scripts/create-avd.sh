#!/usr/bin/env bash

set -euo pipefail

: "${ANDROID_HOME:=${ANDROID_SDK_ROOT:-}}"
: "${ANDROID_HOME:?Set ANDROID_HOME or ANDROID_SDK_ROOT}"

AVD_NAME="pixel_7_pro"
API_LEVEL="34"
TARGET="google_apis"
ARCH="arm64-v8a"

SDK_BIN="$ANDROID_HOME/cmdline-tools/latest/bin"
[[ -x "$SDK_BIN/sdkmanager" ]] || { echo "sdkmanager not found at $SDK_BIN" >&2; exit 1; }

echo "Installing Android emulator + system image..."

$SDK_BIN/sdkmanager --install emulator
$SDK_BIN/sdkmanager "platform-tools"
$SDK_BIN/sdkmanager "platforms;android-$API_LEVEL"
$SDK_BIN/sdkmanager "system-images;android-$API_LEVEL;$TARGET;$ARCH"

yes | $SDK_BIN/sdkmanager --licenses

echo "Checking existing AVD..."

if $SDK_BIN/avdmanager list avd | grep -q "$AVD_NAME"; then
  echo "AVD already exists — deleting for clean alignment"
  $SDK_BIN/avdmanager delete avd -n "$AVD_NAME"
fi

echo "Creating Pixel 7 Pro AVD..."

echo "no" | $SDK_BIN/avdmanager create avd \
  -n "$AVD_NAME" \
  -k "system-images;android-$API_LEVEL;$TARGET;$ARCH" \
  -d "pixel_7_pro"

echo "Applying CI-aligned hardware configuration..."

CONFIG="$HOME/.android/avd/$AVD_NAME.avd/config.ini"

cat >> "$CONFIG" <<EOF
hw.cpu.ncore=4
hw.ramSize=4096
disk.dataPartition.size=4096M
hw.gpu.enabled=yes
hw.gpu.mode=swiftshader_indirect
showDeviceFrame=no
hw.audioInput=no
hw.audioOutput=no
fastboot.forceColdBoot=yes
EOF

echo "✅ Emulator '$AVD_NAME' created successfully"