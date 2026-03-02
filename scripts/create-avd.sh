#!/usr/bin/env bash
set -e

if [ -z "$ANDROID_HOME" ]; then
  export ANDROID_HOME="$ANDROID_SDK_ROOT"
fi

if [ -z "$ANDROID_HOME" ]; then
  export ANDROID_HOME="$HOME/Android/Sdk"
fi

export PATH=$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH

API_LEVEL=34
PROFILE="pixel_7_pro"
TARGET="google_apis"

HOST_ARCH=$(uname -m)

if [[ "$HOST_ARCH" == "arm64" || "$HOST_ARCH" == "aarch64" ]]; then
  ABI="arm64-v8a"
else
  ABI="x86_64"
fi

AVD_NAME="${PROFILE}-api-${API_LEVEL}-${TARGET}-${ABI}"

export API_LEVEL
export PROFILE
export TARGET
export ABI
export AVD_NAME

if [ -n "$GITHUB_ENV" ]; then
  echo "API_LEVEL=$API_LEVEL" >> "$GITHUB_ENV"
  echo "PROFILE=$PROFILE" >> "$GITHUB_ENV"
  echo "TARGET=$TARGET" >> "$GITHUB_ENV"
  echo "ABI=$ABI" >> "$GITHUB_ENV"
  echo "AVD_NAME=$AVD_NAME" >> "$GITHUB_ENV"
fi

# ✅ STOP HERE when running in GitHub Actions
if [ "$GITHUB_ACTIONS" = "true" ]; then
  echo "Running in GitHub Actions — skipping AVD creation"
  exit 0
fi

HOST_ARCH=$(uname -m)
echo "Host architecture: $HOST_ARCH"
echo "Using emulator ABI: $ABI"

IMAGE="system-images;android-${API_LEVEL};${TARGET};${ABI}"

echo "Installing emulator + system image"

sdkmanager --install emulator
sdkmanager "$IMAGE"
yes | sdkmanager --licenses

echo "Creating AVD"

echo "no" | avdmanager create avd \
  -n "$AVD_NAME" \
  -d "$PROFILE" \
  --package "$IMAGE"

CONFIG="$HOME/.android/avd/${AVD_NAME}.avd/config.ini"

echo "hw.lcd.density=440" >> "$CONFIG"
echo "hw.lcd.height=2280" >> "$CONFIG"
echo "hw.lcd.width=1080" >> "$CONFIG"
echo "hw.gpu.enabled=yes" >> "$CONFIG"
echo "hw.ramSize=4096" >> "$CONFIG"
echo "vm.heapSize=512" >> "$CONFIG"

echo "AVD created: $AVD_NAME ($ABI)"