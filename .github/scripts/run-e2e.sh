#!/usr/bin/env bash
set -euo pipefail

PLATFORM="${1:?usage: run-e2e.sh <android|ios> <shard>}"
SHARD="${2:?usage: run-e2e.sh <android|ios> <shard>}"
TESTS_DIR="e2e/tests"
OUTPUT_DIR=".e2e"
RUN_TIMEOUT="${RUN_TIMEOUT:-40m}"
RERUN_TIMEOUT="${RERUN_TIMEOUT:-25m}"
RETRIES="${RETRIES:-2}"
ANDROID_DEVICE="${E2E_ANDROID_DEVICE:-emulator-5554}"
NODE_TS=(node --experimental-strip-types --disable-warning=ExperimentalWarning --disable-warning=MODULE_TYPELESS_PACKAGE_JSON)

TIMEOUT_BIN="$(command -v timeout || command -v gtimeout || true)"

case "$PLATFORM" in
  android)
    command -v adb >/dev/null 2>&1 || { echo "ERROR: adb not found"; exit 2; }
    ;;
  ios)
    command -v xcrun >/dev/null 2>&1 || { echo "ERROR: xcrun not found"; exit 2; }
    ;;
  *)
    echo "usage: run-e2e.sh <android|ios> <shard>"
    exit 2
    ;;
esac

E2E_SERVER="$("${NODE_TS[@]}" --input-type=module -e "const { data } = await import('./e2e/support/data.ts'); process.stdout.write(data.server)" || true)"
if [ -z "$E2E_SERVER" ]; then
  echo "::error title=E2E server URL not found::Could not read data.server from e2e/support/data.ts. This is a CI config failure, not an app or test regression."
  exit 3
fi
echo "Preflight: checking E2E server ${E2E_SERVER} ..."
PREFLIGHT_CODE="$(curl -s -o /dev/null -w '%{http_code}' --max-time 25 --retry 3 --retry-all-errors --retry-delay 5 "${E2E_SERVER}/api/info" || true)"
if [ "$PREFLIGHT_CODE" != "200" ]; then
  echo "::error title=E2E server unreachable::${E2E_SERVER}/api/info returned HTTP ${PREFLIGHT_CODE:-000} — the test server is likely down. This is an environment failure, not an app or test regression."
  exit 3
fi
echo "Preflight OK: ${E2E_SERVER}/api/info -> 200"

ANDROID_HEALTH_ATTEMPTS="${ANDROID_HEALTH_ATTEMPTS:-3}"

android_shell() {
  adb -s "$ANDROID_DEVICE" shell "$@"
}

wait_for_android_boot() {
  adb -s "$ANDROID_DEVICE" wait-for-device
  until [ "$(android_shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = "1" ]; do
    sleep 2
  done
}

android_window_focus_healthy() {
  android_shell cmd activity wait-for-broadcast-idle >/dev/null 2>&1 || true
  sleep 5
  android_shell am start -W -a android.settings.SETTINGS >/dev/null 2>&1 || return 1
  sleep 2
  local windows
  windows="$(android_shell dumpsys window 2>/dev/null)"
  android_shell input keyevent KEYCODE_HOME >/dev/null 2>&1 || true
  if grep -q "Application Not Responding" <<<"$windows"; then
    return 1
  fi
  grep -m1 "mCurrentFocus=" <<<"$windows" | grep -q "com.android.settings"
}

ensure_android_window_focus() {
  for attempt in $(seq 1 "$ANDROID_HEALTH_ATTEMPTS"); do
    if android_window_focus_healthy; then
      echo "Emulator window focus OK (attempt ${attempt})"
      return 0
    fi
    echo "::warning title=Emulator unhealthy::Window focus is stuck or an ANR dialog is showing (attempt ${attempt}); rebooting the emulator."
    adb -s "$ANDROID_DEVICE" reboot
    wait_for_android_boot
  done
  echo "::error title=Emulator unhealthy::The emulator never reached a healthy window focus after ${ANDROID_HEALTH_ATTEMPTS} attempts. This is an environment failure, not an app or test regression."
  exit 3
}

if [ "$PLATFORM" = "android" ]; then
  ensure_android_window_focus
  android_shell settings put system show_touches 1 || true
  android_shell settings put secure autofill_service null || true

  if [ -d "$TESTS_DIR/share-extension" ] \
    && grep -rhoE "tags:[[:space:]]*\[[^]]*\]" "$TESTS_DIR/share-extension" --include='*.e2e.ts' | grep -E "['\"]test-${SHARD}['\"]" >/dev/null; then
    if ! E2E_ANDROID_DEVICE="$ANDROID_DEVICE" pnpm run --silent e2e:push-downloads; then
      echo "::error title=Share fixture push failed::scripts/push-downloads-to-sim.js could not download or push the share-extension fixtures to the emulator's Downloads. This is an environment failure, not an app or test regression."
      exit 3
    fi
  fi
fi

E2E_COMMAND=(pnpm exec e2e run --target "$PLATFORM" --tag "test-${SHARD}" --reporter list,junit)

run_e2e_pass() {
  local pass_timeout="$1"
  shift
  rc=0
  if [ -n "$TIMEOUT_BIN" ]; then
    "$TIMEOUT_BIN" -k 30s "$pass_timeout" "${E2E_COMMAND[@]}" "$@" || rc=$?
  else
    "${E2E_COMMAND[@]}" "$@" || rc=$?
  fi

  if [ "$rc" -eq 124 ] || [ "$rc" -eq 137 ]; then
    echo "::error title=E2E run timed out::'e2e run' exceeded ${pass_timeout} and was terminated (likely a wedged simulator or emulator). This is an environment failure, not an app or test regression."
    exit "$rc"
  fi

  if [ ! -f "$OUTPUT_DIR/junit.xml" ]; then
    echo "::error title=E2E run produced no report::'e2e run' exited ${rc} without writing ${OUTPUT_DIR}/junit.xml (config, collection, or device startup failure). Re-run the failed job if this looks transient."
    exit $(( rc == 0 ? 1 : rc ))
  fi
}

run_e2e_pass "$RUN_TIMEOUT" --retries "$RETRIES"

if [ "$rc" -ne 0 ]; then
  echo "::warning title=E2E rerun::Rerunning the tests that failed, with a fresh agent-device daemon. The runner never retries infrastructure failures (simulator, emulator, or automation runner), so a single flake would otherwise fail the shard."
  pnpm exec agent-device daemon stop --clean || true
  run_e2e_pass "$RERUN_TIMEOUT" --last-failed --retries 0
fi

if [ "$rc" -ne 0 ]; then
  SERVER_ERR="$(grep -hoE "ECONNREFUSED|ENOTFOUND|ETIMEDOUT|ECONNRESET|fetch failed" "$OUTPUT_DIR/report.json" 2>/dev/null | sort -u | head -5 | paste -sd ';' - || true)"
  if [ -n "$SERVER_ERR" ]; then
    echo "::error title=E2E server error during run::A request to ${E2E_SERVER} failed mid-run (${SERVER_ERR}). The shard failure is likely a server/environment flake, not an app or test regression."
  fi
fi

exit "$rc"
