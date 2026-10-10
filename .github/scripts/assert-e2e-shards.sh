#!/usr/bin/env bash
set -euo pipefail

SHARD_COUNT=10

listing="$(pnpm exec e2e list --reporter json)"

untagged="$(echo "$listing" | jq -r '.pairs[] | select(all(.tags[]; test("^test-[0-9]+$") | not)) | "\(.file) › \(.title) [\(.target)]"' | sort -u)"

found="$(echo "$listing" | jq -r '.pairs[].tags[] | capture("^test-(?<n>[0-9]+)$").n' | sort -n -u)"

missing=()
for n in $(seq 1 "$SHARD_COUNT"); do
  printf '%s\n' "$found" | grep -qx "$n" || missing+=("$n")
done

extra=()
while IFS= read -r n; do
  [ -z "$n" ] && continue
  if [ "$n" -lt 1 ] || [ "$n" -gt "$SHARD_COUNT" ]; then
    extra+=("$n")
  fi
done <<< "$found"

if [ -n "$untagged" ] || [ ${#missing[@]} -gt 0 ] || [ ${#extra[@]} -gt 0 ]; then
  echo "::error title=E2E shard drift::Every test needs a test-<N> tag, and the tags must cover exactly the declared 1..${SHARD_COUNT} shard list."
  [ -n "$untagged" ] && printf '  Tests with no test-<N> tag (never scheduled):\n%s\n' "$(echo "$untagged" | sed 's/^/    /')"
  [ ${#missing[@]} -gt 0 ] && echo "  Shards with no test tagged test-<N>: ${missing[*]}"
  [ ${#extra[@]} -gt 0 ] && echo "  Tests tagged outside 1..${SHARD_COUNT}: ${extra[*]}"
  exit 1
fi

json="$(seq -s, 1 "$SHARD_COUNT")"
json="[${json%,}]"
echo "E2E shard coverage OK: every test tagged, test-1..test-${SHARD_COUNT} all present, none out of range."
echo "shards=${json}"
if [ -n "${GITHUB_OUTPUT:-}" ]; then
  echo "shards=${json}" >> "$GITHUB_OUTPUT"
fi
