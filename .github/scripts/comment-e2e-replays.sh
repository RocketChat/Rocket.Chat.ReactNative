#!/usr/bin/env bash
set -euo pipefail

REPLAYS_DIR="${1:?usage: comment-e2e-replays.sh <replays-dir>}"
: "${PR_NUMBER:?}" "${RUN_ID:?}" "${GITHUB_REPOSITORY:?}"
MARKER="<!-- e2e-replays -->"
RUN_URL="https://github.com/$GITHUB_REPOSITORY/actions/runs/$RUN_ID"

existing_comment_id="$(gh api --paginate "repos/$GITHUB_REPOSITORY/issues/$PR_NUMBER/comments" \
  --jq ".[] | select(.body | startswith(\"$MARKER\")) | .id" | tail -n 1)"

entries=()
if [ -d "$REPLAYS_DIR" ]; then
  while IFS= read -r entry; do entries+=("$entry"); done < <(find "$REPLAYS_DIR" -type f -name '*.json' | sort)
fi

if [ "${#entries[@]}" -eq 0 ]; then
  [ -n "$existing_comment_id" ] || exit 0
  body="$MARKER
### E2E agent replays in sync

[This run]($RUN_URL) recorded no agent replays missing from \`.e2e/cache/\`."
else
  tests="$(jq -r '.payload.recordedFor | "\(.testId | split("::")[0])\t\(.targetId)"' "${entries[@]}" \
    | sort -u \
    | awk -F'\t' '{ targets[$1] = targets[$1] ? targets[$1] ", " $2 : $2 } END { for (test in targets) print "- `" test "` (" targets[test] ")" }' \
    | sort)"
  body="$MARKER
### New E2E agent replays

[This run]($RUN_URL) ran these \`agent.act\` steps on the model and recorded replays that \`.e2e/cache/\` does not have:

$tests

Add them so later runs replay without model calls:

\`\`\`bash
dir=\"\$(mktemp -d)\" && gh run download $RUN_ID -R $GITHUB_REPOSITORY -p 'e2e-replays-*' -D \"\$dir\" && cp \"\$dir\"/*/*.json .e2e/cache/
\`\`\`

Then commit \`.e2e/cache/\`. The artifacts expire after 14 days; after that, run the tests locally to record them."
fi

if [ -n "$existing_comment_id" ]; then
  gh api -X PATCH "repos/$GITHUB_REPOSITORY/issues/comments/$existing_comment_id" -f body="$body" >/dev/null
else
  gh api "repos/$GITHUB_REPOSITORY/issues/$PR_NUMBER/comments" -f body="$body" >/dev/null
fi
