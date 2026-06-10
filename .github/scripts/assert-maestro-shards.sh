#!/usr/bin/env bash
set -euo pipefail

# Single source of truth for the Maestro shard list. The PR matrix fans out over
# exactly these shards (this script emits the JSON array it consumes), and every
# flow under .maestro/tests must carry a test-<N> tag with N inside the range.
# This job asserts the two stay in lockstep: a flow tagged outside the range, or
# a shard in the range with no flow tagged for it, fails the run loud — instead
# of that flow silently never executing (a gap) or a tag never being scheduled.
SHARD_COUNT=14
FLOWS_DIR=".maestro/tests"

declared=()
for n in $(seq 1 "$SHARD_COUNT"); do declared+=("$n"); done

# test-<N> values actually tagged on flows, keyed off the same tag-list-item
# shape run-maestro.sh matches (a `- test-N` entry, optionally quoted).
found="$(grep -rhoE "^[[:space:]]*-[[:space:]]*['\"]?test-[0-9]+" "$FLOWS_DIR" \
  --include='*.yaml' --include='*.yml' \
  | grep -oE '[0-9]+' | sort -n -u)"

missing=()
for n in "${declared[@]}"; do
  printf '%s\n' "$found" | grep -qx "$n" || missing+=("$n")
done

extra=()
while IFS= read -r n; do
  [ -z "$n" ] && continue
  if [ "$n" -lt 1 ] || [ "$n" -gt "$SHARD_COUNT" ]; then
    extra+=("$n")
  fi
done <<< "$found"

if [ ${#missing[@]} -gt 0 ] || [ ${#extra[@]} -gt 0 ]; then
  echo "::error title=Maestro shard drift::Flow test-<N> tags do not match the declared 1..${SHARD_COUNT} shard list."
  [ ${#missing[@]} -gt 0 ] && echo "  Shards with no flow tagged test-<N>: ${missing[*]}"
  [ ${#extra[@]} -gt 0 ] && echo "  Flows tagged outside 1..${SHARD_COUNT}: ${extra[*]}"
  exit 1
fi

json="$(printf '%s,' "${declared[@]}")"
json="[${json%,}]"
echo "Maestro shard coverage OK: test-1..test-${SHARD_COUNT} all present, none out of range."
echo "shards=${json}"
if [ -n "${GITHUB_OUTPUT:-}" ]; then
  echo "shards=${json}" >> "$GITHUB_OUTPUT"
fi
