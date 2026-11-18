#!/usr/bin/env bash
# https://github.com/ReactiveCircus/android-emulator-runner/blob/v2.37.0/src/emulator-manager.ts#L140-L171
set -uo pipefail

ACTION_PID="${1:?usage: android-boot-watchdog.sh <action-pid>}"
BOOT_DEADLINE_SECONDS="${BOOT_DEADLINE_SECONDS:-1080}"
POLL_SECONDS="${POLL_SECONDS:-10}"
E2E_SCRIPT_PATTERN="${E2E_SCRIPT_PATTERN:-run-e2e.sh android}"

deadline=$((SECONDS + BOOT_DEADLINE_SECONDS))
while kill -0 "$ACTION_PID" 2>/dev/null; do
  if pgrep -f "$E2E_SCRIPT_PATTERN" >/dev/null; then
    exit 0
  fi
  if [ "$SECONDS" -ge "$deadline" ]; then
    echo "::error title=Emulator boot hung::The emulator did not finish booting within ${BOOT_DEADLINE_SECONDS}s, so the step was stopped instead of waiting for its timeout. This is an environment failure, not an app or test regression; rerun the job."
    kill -TERM "$ACTION_PID"
    exit 1
  fi
  sleep "$POLL_SECONDS"
done
