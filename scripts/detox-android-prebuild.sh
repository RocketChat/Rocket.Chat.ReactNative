#!/usr/bin/env bash

### Change minsdk version to 24
echo "### Change minsdk version to 24 ###"
sed -i '' "s/minSdkVersion = 21/minSdkVersion = 24/g" android/build.gradle

### Add keystore credentials to android/gradle.properties
echo "### Add keystore credentials to android/gradle.properties ###"
echo 'KEYSTORE=RocketChatDebug' >> android/gradle.properties
echo 'KEYSTORE_PASSWORD=RocketChatDebug' >> android/gradle.properties
echo 'KEY_ALIAS=RocketChatDebug' >> android/gradle.properties
echo 'KEY_PASSWORD=RocketChatDebug' >> android/gradle.properties
