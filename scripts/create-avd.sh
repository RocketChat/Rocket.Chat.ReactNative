#!/usr/bin/env bash
set -e

if [ -z "$ANDROID_HOME" ]; then
  export ANDROID_HOME="$ANDROID_SDK_ROOT"
fi

if [ -z "$ANDROID_HOME" ]; then
  export ANDROID_HOME="$HOME/Android/Sdk"
fi

export PATH=$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH

echo "ANDROID_HOME=$ANDROID_HOME"
echo "PATH=$PATH"

API_LEVEL=34
AVD_NAME="Pixel_API_${API_LEVEL}"

HOST_ARCH=$(uname -m)

if [[ "$HOST_ARCH" == "arm64" || "$HOST_ARCH" == "aarch64" ]]; then
  ABI="arm64-v8a"
else
  ABI="x86_64"
fi

echo "Host architecture: $HOST_ARCH"
echo "Using emulator ABI: $ABI"

IMAGE="system-images;android-${API_LEVEL};google_apis;${ABI}"

echo "Installing emulator + system image"

yes | sdkmanager --licenses
sdkmanager --install emulator
sdkmanager "$IMAGE"

echo "Creating AVD"

AVD_BASE="$HOME/.android/avd"
mkdir -p "$AVD_BASE"

echo "no" | avdmanager create avd \
  -n "$AVD_NAME" \
  -d "pixel_7_pro" \
  --package "$IMAGE"
AVD_INI="$AVD_BASE/${AVD_NAME}.ini"

if [ ! -f "$AVD_INI" ]; then
  echo "Expected AVD ini not found: $AVD_INI"
  echo "--- avdmanager list avd ---"
  avdmanager list avd || true
  echo "--- ls AVD_BASE ---"
  ls -la "$AVD_BASE" || true
  exit 1
fi

AVD_PATH="$(sed -n 's/^path=//p' "$AVD_INI")"
if [ -z "$AVD_PATH" ]; then
  echo "Could not resolve AVD path from: $AVD_INI"
  cat "$AVD_INI"
  exit 1
fi

CONFIG="$AVD_PATH/config.ini"
if [ ! -f "$CONFIG" ]; then
  echo "Expected AVD config not found: $CONFIG"
  ls -la "$AVD_BASE" || true
  ls -la "$AVD_PATH" || true
  exit 1
fi

echo "hw.lcd.density=420" >> "$CONFIG"
echo "hw.lcd.height=2424" >> "$CONFIG"
echo "hw.lcd.width=1080" >> "$CONFIG"
echo "hw.gpu.enabled=yes" >> "$CONFIG"

echo "AVD created: $AVD_NAME ($ABI)"