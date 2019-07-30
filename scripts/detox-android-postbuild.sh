#!/usr/bin/env bash

### Revert minsdk version to 21
echo "### Revert minsdk version to 21 ###"
sed -i '' "s/minSdkVersion = 24/minSdkVersion = 21/g" android/build.gradle

### Remore keystore credentials to android/gradle.properties
echo "### Remore keystore credentials from android/gradle.properties ###"
sed -i '' '/KEYSTORE=RocketChatDebug/d' android/gradle.properties
sed -i '' '/KEYSTORE_PASSWORD=RocketChatDebug/d' android/gradle.properties
sed -i '' '/KEY_ALIAS=RocketChatDebug/d' android/gradle.properties
sed -i '' '/KEY_PASSWORD=RocketChatDebug/d' android/gradle.properties
