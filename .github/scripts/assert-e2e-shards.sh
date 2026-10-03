#!/usr/bin/env bash
set -euo pipefail

SHARD_COUNT=14
TESTS_DIR="e2e/tests"

declared=()
for n in $(seq 1 "$SHARD_COUNT"); do declared+=("$n"); done

found="$(grep -rhoE "tags:[[:space:]]*\[[^]]*\]" "$TESTS_DIR" --include='*.e2e.ts' \
  | grep -oE 'test-[0-9]+' | grep -oE '[0-9]+' | sort -n -u)"

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
  echo "::error title=E2E shard drift::Test test-<N> tags do not match the declared 1..${SHARD_COUNT} shard list."
  [ ${#missing[@]} -gt 0 ] && echo "  Shards with no test tagged test-<N>: ${missing[*]}"
  [ ${#extra[@]} -gt 0 ] && echo "  Tests tagged outside 1..${SHARD_COUNT}: ${extra[*]}"
  exit 1
fi

json="$(printf '%s,' "${declared[@]}")"
json="[${json%,}]"
echo "E2E shard coverage OK: test-1..test-${SHARD_COUNT} all present, none out of range."
echo "shards=${json}"
if [ -n "${GITHUB_OUTPUT:-}" ]; then
  echo "shards=${json}" >> "$GITHUB_OUTPUT"
fi
