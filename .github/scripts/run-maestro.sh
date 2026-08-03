#!/usr/bin/env bash
set -euo pipefail

PLATFORM="${1:-${PLATFORM:-android}}"
SHARD="${2:-${SHARD:-default}}"
FLOWS_DIR=".maestro/tests"
MAIN_REPORT="maestro-report.xml"
MAX_RERUN_ROUNDS="${MAX_RERUN_ROUNDS:-2}"
RERUN_REPORT_PREFIX="maestro-rerun"
export MAESTRO_DRIVER_STARTUP_TIMEOUT="${MAESTRO_DRIVER_STARTUP_TIMEOUT:-300000}"

# Linux has timeout, macOS has gtimeout (Homebrew coreutils)
TIMEOUT_BIN="$(command -v timeout || command -v gtimeout || true)"

# Bound each `maestro test` so a wedged CoreSimulator child can't hang the job;
# 124/137 = timed out, annotated as an environment failure.
run_maestro_test() {
  local rc=0
  if [ -n "$TIMEOUT_BIN" ]; then
    "$TIMEOUT_BIN" -k 30s 35m maestro test "$@" || rc=$?
  else
    maestro test "$@" || rc=$?
  fi
  if [ "$rc" -eq 124 ] || [ "$rc" -eq 137 ]; then
    echo "::error title=Maestro run timed out::A 'maestro test' invocation exceeded 35m and was terminated (likely a wedged CoreSimulator). This is an environment failure, not an app or test regression."
  fi
  return 0
}

# The deeplink-login flow logs a live session token; scrub it before the logs
# upload as a public artifact. perl -i works on both Linux and macOS.
redact_uploaded_logs() {
  local logs_dir="$HOME/.maestro/tests"
  [ -d "$logs_dir" ] || return 0
  find "$logs_dir" -type f -print0 \
    | xargs -0 perl -pi -e 's/&token=[A-Za-z0-9_-]+/&token=***REDACTED***/g' 2>/dev/null || true
}

if [ "$PLATFORM" = "android" ]; then
  APP_ID="chat.rocket.android"
else
  APP_ID="chat.rocket.ios"
fi

if ! command -v maestro >/dev/null 2>&1; then
  echo "ERROR: maestro not found in PATH"
  exit 2
fi

if [ "$PLATFORM" = "android" ]; then
  if ! command -v adb >/dev/null 2>&1; then
    echo "ERROR: adb not found"
    exit 2
  fi
else
  if ! command -v xcrun >/dev/null 2>&1; then
    echo "ERROR: xcrun not found"
    exit 2
  fi
fi

# Probe the E2E server up front so an outage surfaces as one clear annotation
# instead of opaque flow failures. data.js is the source of the server URL.
E2E_SERVER="$(sed -n "s/^[[:space:]]*server:[[:space:]]*['\"]\([^'\"]*\)['\"].*/\1/p" .maestro/scripts/data.js | head -1)"
if [ -z "$E2E_SERVER" ]; then
  echo "::error title=E2E server URL not found::Could not scrape 'server' from .maestro/scripts/data.js — its format may have changed. This is a CI config failure, not an app or test regression."
  exit 3
fi
echo "Preflight: checking E2E server ${E2E_SERVER} ..."
PREFLIGHT_CODE="$(curl -s -o /dev/null -w '%{http_code}' --max-time 25 --retry 3 --retry-all-errors --retry-delay 5 "${E2E_SERVER}/api/info" || true)"
if [ "$PREFLIGHT_CODE" != "200" ]; then
  echo "::error title=E2E server unreachable::${E2E_SERVER}/api/info returned HTTP ${PREFLIGHT_CODE:-000} — the test server is likely down. This is an environment failure, not an app or test regression."
  exit 3
fi
echo "Preflight OK: ${E2E_SERVER}/api/info -> 200"

MAPFILE="$(mktemp)"
# Redact on every exit path, before the always() upload reads the logs
trap 'rm -f "$MAPFILE"; redact_uploaded_logs' EXIT

while IFS= read -r -d '' file; do
  if grep -qE "^[[:space:]]*-[[:space:]]*['\"]?test-${SHARD}['\"]?([[:space:]]*$|[[:space:]]*,|[[:space:]]*\\])" "$file"; then
    raw_name="$(grep -m1 -E '^[[:space:]]*name:' "$file" || true)"
    if [ -n "$raw_name" ]; then
      name_val="$(echo "$raw_name" | sed -E 's/^[[:space:]]*name:[[:space:]]*//; s/^["'\'']//; s/["'\'']$//; s/[[:space:]]*$//')"
      name_val="$(echo "$name_val" | sed -E 's/^[[:space:]]+//; s/[[:space:]]+$//')"
      if [ -n "$name_val" ]; then
        printf '%s\t%s\n' "$name_val" "$file" >> "$MAPFILE"
      fi
    fi
  fi
done < <(find "$FLOWS_DIR" -type f \( -iname '*.yml' -o -iname '*.yaml' \) -print0)

if [ ! -s "$MAPFILE" ]; then
  echo "No flows for test-${SHARD}"
  exit 1
fi

echo "Mapped flows for tag test-${SHARD}:"
awk -F'\t' '{ printf "  %s -> %s\n", $1, $2 }' "$MAPFILE"

FLOW_FILES=()
SEEN_PATHS=""

while IFS=$'\t' read -r name path; do
  if ! printf '%s\n' "$SEEN_PATHS" | grep -Fqx "$path"; then
    FLOW_FILES+=("$path")
    SEEN_PATHS="${SEEN_PATHS}"$'\n'"$path"
  fi
done < "$MAPFILE"

echo "Main run will execute:"
printf '  %s\n' "${FLOW_FILES[@]}"

run_main_suite() {
  rm -f "$MAIN_REPORT"
  if [ "$PLATFORM" = "android" ]; then
    adb shell settings put system show_touches 1 || true
    adb install -r "app-release.apk" || true

    run_maestro_test "${FLOW_FILES[@]}" \
      -e APP_ID="$APP_ID" \
      --exclude-tags=util \
      --include-tags="test-${SHARD}" \
      --exclude-tags=ios-only \
      --format junit \
      --output "$MAIN_REPORT"
  else
    run_maestro_test "${FLOW_FILES[@]}" \
      -e APP_ID="$APP_ID" \
      --exclude-tags=util \
      --include-tags="test-${SHARD}" \
      --exclude-tags=android-only \
      --format junit \
      --output "$MAIN_REPORT"
  fi
}

run_main_suite

# No JUnit output = startup failure; go red for a human re-run instead of
# auto-retrying, which would hide real startup breakage.
if [ ! -f "$MAIN_REPORT" ]; then
  echo "::error title=Maestro session produced no report::The Maestro run produced no JUnit output (session/driver-startup failure or a timeout — see the annotation above). Re-run the failed job if this looks transient."
  exit 1
fi

FAILED_NAMES="$(python3 - <<PY
import sys,xml.etree.ElementTree as ET
try:
  tree = ET.parse("$MAIN_REPORT")
except:
  sys.exit(0)
root = tree.getroot()
failed=[]
for tc in root.findall(".//testcase"):
  if tc.find("failure") is not None or tc.find("error") is not None:
    if tc.get("name"):
      failed.append(tc.get("name").strip())
for n in sorted(set(failed)):
  print(n)
PY
)"

if [ -z "$FAILED_NAMES" ]; then
  echo "All tests passed."
  exit 0
fi

IFS=$'\n' read -rd '' -a FAILED_ARRAY <<<"$FAILED_NAMES" || true

CANDIDATE_FILES=()
SEEN2=""
for NAME in "${FAILED_ARRAY[@]}"; do
  FILE="$(awk -F'\t' -v n="$NAME" '$1==n {print $2; exit}' "$MAPFILE" || true)"
  if [ -n "$FILE" ] && ! printf '%s\n' "$SEEN2" | grep -Fq "$FILE"; then
    CANDIDATE_FILES+=("$FILE")
    SEEN2="${SEEN2}"$'\n'"${FILE}"
  fi
done

if [ ${#CANDIDATE_FILES[@]} -eq 0 ]; then
  echo "No flow files to retry"
  exit 1
fi

CURRENT_FAILS=("${CANDIDATE_FILES[@]}")
ROUND=1

while [ ${#CURRENT_FAILS[@]} -gt 0 ] && [ "$ROUND" -le "$MAX_RERUN_ROUNDS" ]; do
  echo "=== RERUN ROUND $ROUND (${#CURRENT_FAILS[@]} flows) ==="

  RPT="${RERUN_REPORT_PREFIX}-round-${ROUND}.xml"

  if [ "$PLATFORM" = "android" ]; then
    run_maestro_test "${CURRENT_FAILS[@]}" \
      -e APP_ID="$APP_ID" \
      --exclude-tags=util \
      --include-tags="test-${SHARD}" \
      --exclude-tags=ios-only \
      --format junit \
      --output "$RPT"
  else
    run_maestro_test "${CURRENT_FAILS[@]}" \
      -e APP_ID="$APP_ID" \
      --exclude-tags=util \
      --include-tags="test-${SHARD}" \
      --exclude-tags=android-only \
      --format junit \
      --output "$RPT"
  fi

  if [ ! -f "$RPT" ]; then
    echo "Rerun report missing"
    break
  fi

  NEXT_FAILED="$(python3 - <<PY
import sys,xml.etree.ElementTree as ET
try:
  tree = ET.parse("$RPT")
except:
  sys.exit(0)
root = tree.getroot()
failed=[]
for tc in root.findall(".//testcase"):
  if tc.find("failure") is not None or tc.find("error") is not None:
    if tc.get("name"):
      failed.append(tc.get("name").strip())
for n in sorted(set(failed)):
  print(n)
PY
)"

  if [ -z "$NEXT_FAILED" ]; then
    echo "All retried flows passed in this round."
    exit 0
  fi

  IFS=$'\n' read -rd '' -a NEXT_FAILED_ARRAY <<<"$NEXT_FAILED" || true

  NEXT_FILES=()
  SEEN3=""
  for NAME in "${NEXT_FAILED_ARRAY[@]}"; do
    FILE="$(awk -F'\t' -v n="$NAME" '$1==n {print $2; exit}' "$MAPFILE" || true)"
    if [ -n "$FILE" ] && ! printf '%s\n' "$SEEN3" | grep -Fq "$FILE"; then
      NEXT_FILES+=("$FILE")
      SEEN3="${SEEN3}"$'\n'"${FILE}"
    fi
  done

  CURRENT_FAILS=("${NEXT_FILES[@]}")
  ROUND=$((ROUND+1))
done

echo "Retry strategy finished with remaining failures:"
printf '%s\n' "${CURRENT_FAILS[@]}"

# The server can also blip after preflight; scan the local logs and annotate so
# an environment failure doesn't read like an app bug.
SERVER_ERR="$(grep -rhoE "Non-retryable error [0-9]{3}|Connection refused|Failed to connect|UnknownHostException|ConnectException|Read timed out" "$HOME/.maestro/tests/" 2>/dev/null | sort -u | head -5 | paste -sd '; ' - || true)"
if [ -n "$SERVER_ERR" ]; then
  echo "::error title=E2E server error during run::A test-setup REST call to ${E2E_SERVER:-the test server} failed mid-run (${SERVER_ERR}). The shard failure is likely a server/environment flake, not an app or test regression."
fi

exit 1
