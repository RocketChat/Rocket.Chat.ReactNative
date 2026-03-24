#!/usr/bin/env bash
set -euo pipefail

PLATFORM="${1:-${PLATFORM:-android}}"
SHARD="${2:-${SHARD:-default}}"
FLOWS_DIR=".maestro/tests"
MAIN_REPORT="maestro-report.xml"
MAX_RERUN_ROUNDS="${MAX_RERUN_ROUNDS:-3}"
RERUN_REPORT_PREFIX="maestro-rerun"
export MAESTRO_DRIVER_STARTUP_TIMEOUT="${MAESTRO_DRIVER_STARTUP_TIMEOUT:-120000}"

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

MAPFILE="$(mktemp)"
trap 'rm -f "$MAPFILE"' EXIT

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

if [ "$PLATFORM" = "android" ]; then
  adb shell settings put system show_touches 1 || true
  adb install -r "app-experimental-release.apk" || true
  adb shell monkey -p "chat.rocket.reactnative" -c android.intent.category.LAUNCHER 1 || true
  sleep 6
  adb shell am force-stop "chat.rocket.reactnative" || true

  maestro test "${FLOW_FILES[@]}" \
    --exclude-tags=util \
    --include-tags="test-${SHARD}" \
    --format junit \
    --output "$MAIN_REPORT" || true

else
  maestro test "${FLOW_FILES[@]}" \
    --exclude-tags=util \
    --include-tags="test-${SHARD}" \
    --exclude-tags=android-only \
    --format junit \
    --output "$MAIN_REPORT" || true
fi

if [ ! -f "$MAIN_REPORT" ]; then
  echo "Main report not found"
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
    maestro test "${CURRENT_FAILS[@]}" \
      --exclude-tags=util \
      --include-tags="test-${SHARD}" \
      --format junit \
      --output "$RPT" || true
  else
    maestro test "${CURRENT_FAILS[@]}" \
      --exclude-tags=util \
      --include-tags="test-${SHARD}" \
      --exclude-tags=android-only \
      --format junit \
      --output "$RPT" || true
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
exit 1
