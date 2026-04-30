#!/usr/bin/env bash
set -e

if [ -z "$ANDROID_HOME" ]; then
	export ANDROID_HOME="$ANDROID_SDK_ROOT"
fi

if [ -z "$ANDROID_HOME" ]; then
	export ANDROID_HOME="$HOME/Android/Sdk"
fi

export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"

API_LEVEL="${API_LEVEL:-31}"
TARGET="${TARGET:-default}"
DEVICE_PROFILE="${DEVICE_PROFILE:-pixel}"

HOST_ARCH="$(uname -m)"
if [[ "$HOST_ARCH" == "arm64" || "$HOST_ARCH" == "aarch64" ]]; then
	ABI="${ABI:-arm64-v8a}"
else
	ABI="${ABI:-x86_64}"
fi

AVD_NAME="${AVD_NAME:-Pixel_API_${API_LEVEL}_AOSP_Keyboard}"
IMAGE="system-images;android-${API_LEVEL};${TARGET};${ABI}"
CONFIG="$HOME/.android/avd/${AVD_NAME}.avd/config.ini"

echo "ANDROID_HOME=$ANDROID_HOME"
echo "Host architecture: $HOST_ARCH"
echo "Using image: $IMAGE"
echo "Creating AVD: $AVD_NAME"

echo "Accepting Android SDK licenses"
yes | sdkmanager --licenses > /dev/null || true

echo "Installing emulator + system image"
sdkmanager --install emulator
sdkmanager "$IMAGE"

echo "Creating AVD profile"
echo "no" | avdmanager create avd \
	-n "$AVD_NAME" \
	-d "$DEVICE_PROFILE" \
	--package "$IMAGE" \
	--force

echo "Applying keyboard-navigation AVD config"
{
	echo "hw.keyboard=yes"
	echo "hw.keyboard.lid=no"
	echo "hw.lcd.density=440"
	echo "hw.lcd.height=2280"
	echo "hw.lcd.width=1080"
	echo "hw.gpu.enabled=yes"
} >> "$CONFIG"

echo "AVD created: $AVD_NAME"
