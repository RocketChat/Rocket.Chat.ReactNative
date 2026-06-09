#!/bin/sh
set -e

# Owl iOS build helper.
#
# Two reasons this exists instead of letting react-native-owl run its default
# `xcodebuild ... -sdk iphonesimulator`:
#
# 1. The RocketChat scheme embeds the "Rocket.Chat.Watch" Watch App. Forcing
#    every target onto the iphonesimulator SDK breaks the watch target (WatchKit
#    is unavailable there). Building for a *destination* lets each target pick its
#    correct SDK, exactly like `pnpm ios` does.
# 2. The product is "Rocket.Chat.app", but Owl derives the app name from the
#    scheme ("RocketChat.app") for install/launch. We expose a copy under that
#    name so Owl's default (absolute) path resolution works — a custom binaryPath
#    would be resolved relative to /usr/libexec by Owl's PlistBuddy call and fail.

# NOTE: do NOT pass CODE_SIGNING_ALLOWED=NO. The app reads its WatermelonDB path
# from the App Group shared container, which requires the app-group entitlement.
# Disabling signing strips entitlements and the app crashes on launch with
# "Could not resolve database path". Simulator builds ad-hoc sign (and apply
# entitlements) with no developer team, exactly like `pnpm ios`.
xcodebuild \
	-workspace ios/RocketChatRN.xcworkspace \
	-scheme RocketChat \
	-configuration Release \
	-destination 'generic/platform=iOS Simulator' \
	-derivedDataPath ios/build

PRODUCTS="ios/build/Build/Products/Release-iphonesimulator"
rm -rf "$PRODUCTS/RocketChat.app"
cp -R "$PRODUCTS/Rocket.Chat.app" "$PRODUCTS/RocketChat.app"
