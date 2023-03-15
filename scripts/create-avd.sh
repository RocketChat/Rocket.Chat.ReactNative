#!/usr/bin/env bash

$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager --install emulator

$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager "system-images;android-31;default;arm64-v8a"
$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager --licenses

$ANDROID_HOME/cmdline-tools/latest/bin/avdmanager create avd -n Pixel_API_31_AOSP -d pixel --package "system-images;android-31;default;arm64-v8a"

echo "hw.lcd.density = 440" >> ~/.android/avd/Pixel_API_31_AOSP.avd/config.ini
echo "hw.lcd.height = 2280" >> ~/.android/avd/Pixel_API_31_AOSP.avd/config.ini
echo "hw.lcd.width = 1080" >> ~/.android/avd/Pixel_API_31_AOSP.avd/config.ini

echo "Pixel_API_31_AOSP created"