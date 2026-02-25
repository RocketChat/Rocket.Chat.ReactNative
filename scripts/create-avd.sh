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

sdkmanager --install emulator
sdkmanager "$IMAGE"
yes | sdkmanager --licenses

echo "Creating AVD"

echo "no" | avdmanager create avd \
  -n "$AVD_NAME" \
  -d "pixel_7_pro" \
  --package "$IMAGE"

CONFIG="$HOME/.android/avd/${AVD_NAME}.avd/config.ini"

echo "hw.lcd.density=440" >> "$CONFIG"
echo "hw.lcd.height=2280" >> "$CONFIG"
echo "hw.lcd.width=1080" >> "$CONFIG"
echo "hw.gpu.enabled=yes" >> "$CONFIG"

echo "AVD created: $AVD_NAME ($ABI)"