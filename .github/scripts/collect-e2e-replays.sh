#!/usr/bin/env bash
set -euo pipefail

DEST_DIR="${1:?usage: collect-e2e-replays.sh <dest-dir>}"
CACHE_DIR=".e2e/cache"

mkdir -p "$DEST_DIR"

count=0
while IFS= read -r entry; do
  [ -f "$entry" ] || continue
  cp "$entry" "$DEST_DIR/"
  count=$((count + 1))
done < <(git ls-files --others --modified --exclude-standard -- "$CACHE_DIR")

bash "$(dirname "$0")/redact-e2e-output.sh" "$DEST_DIR"

echo "count=$count" >> "$GITHUB_OUTPUT"
