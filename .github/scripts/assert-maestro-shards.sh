#!/usr/bin/env bash
set -euo pipefail

# Emits the shard list the PR matrices fan out over and asserts every flow's
# test-<N> tag falls inside it, so drift fails loud instead of a flow silently
# never running.
SHARD_COUNT=14
FLOWS_DIR=".maestro/tests"

declared=()
for n in $(seq 1 "$SHARD_COUNT"); do declared+=("$n"); done

# Match the same `- test-N` list-item shape run-maestro.sh greps
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
