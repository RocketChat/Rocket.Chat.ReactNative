#!/usr/bin/env bash
set -euo pipefail

SIM_UDID="${1:?usage: warm-up-ios-simulator.sh <udid> <app path>}"
APP_PATH="${2:?usage: warm-up-ios-simulator.sh <udid> <app path>}"
BUNDLE_ID="$(/usr/libexec/PlistBuddy -c 'Print :CFBundleIdentifier' "$APP_PATH/Info.plist")"
RESPONSIVE_SECONDS=2
RESPONSIVE_STREAK=3
RESPONSIVE_DEADLINE=300

wait_until_responsive() {
  local streak=0 started elapsed deadline=$((SECONDS + RESPONSIVE_DEADLINE))
  while [ "$streak" -lt "$RESPONSIVE_STREAK" ]; do
    if [ "$SECONDS" -ge "$deadline" ]; then
      echo "::error title=iOS simulator unresponsive::launchctl did not answer within ${RESPONSIVE_SECONDS}s ${RESPONSIVE_STREAK} times in a row for ${RESPONSIVE_DEADLINE}s. This is an environment failure, not an app or test regression."
      exit 3
    fi
    started=$(date +%s)
    xcrun simctl spawn "$SIM_UDID" launchctl list >/dev/null
    elapsed=$(($(date +%s) - started))
    if [ "$elapsed" -le "$RESPONSIVE_SECONDS" ]; then
      streak=$((streak + 1))
    else
      echo "launchctl took ${elapsed}s"
      streak=0
    fi
  done
}

echo "Waiting for the simulator to respond"
wait_until_responsive

echo "Installing and launching $BUNDLE_ID once"
xcrun simctl install "$SIM_UDID" "$APP_PATH"
xcrun simctl launch "$SIM_UDID" "$BUNDLE_ID"
sleep 20
xcrun simctl terminate "$SIM_UDID" "$BUNDLE_ID" || true

echo "Waiting for the simulator to settle"
wait_until_responsive
echo "Simulator warm"
