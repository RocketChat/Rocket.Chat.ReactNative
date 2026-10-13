#!/usr/bin/env bash
set -uo pipefail

# Narrows the Maestro shard matrix to the shards sniffler flags as impacted by
# the PR diff. Every uncertainty falls back to the full shard list, so
# under-selection is impossible; over-selection is always acceptable.
#
# Emits to $GITHUB_OUTPUT:
#   shards      JSON int array of shards to run
#   should_run  "true" to run e2e; "false" only on a confident zero (no impacted
#               flow), which skips the whole e2e stage.
#
# Env:
#   IS_RELEASE_LANE  "true" forces the full suite (release-cut / release label)
#   BASE_REF         PR base branch name (github.event.pull_request.base.ref)
#   HEAD_SHA         PR head commit sha  (github.event.pull_request.head.sha)
#   FULL_SHARDS      the guaranteed [1..14] list from assert-maestro-shards.sh

emit() {
	echo "shards=$1" >>"$GITHUB_OUTPUT"
	echo "should_run=$2" >>"$GITHUB_OUTPUT"
}

full() {
	emit "$FULL_SHARDS" "true"
	exit 0
}

# 1. Release lane -> full suite.
[ "${IS_RELEASE_LANE:-}" = "true" ] && full

# 2. No base ref (not a PR / unset) -> full.
[ -z "${BASE_REF:-}" ] && full

# 3. merge-base fails/empty -> full (absorbs shallow clone, unfetched base, first run).
git fetch --no-tags --quiet origin "$BASE_REF" 2>/dev/null || true
BASE_SHA="$(git merge-base "origin/$BASE_REF" "$HEAD_SHA" 2>/dev/null)" || true
[ -z "$BASE_SHA" ] && full

# 4. sniffler nonzero exit -> full.
json="$(pnpm exec sniffler impact --base "$BASE_SHA" --head "$HEAD_SHA" --format json)" || full

# 5. JSON unparseable -> full.
echo "$json" | jq -e . >/dev/null 2>&1 || full

# 5b. Missing recommendedTests key -> full (a valid-but-malformed payload must
#     never fall through to the confident-zero skip below).
echo "$json" | jq -e 'has("recommendedTests")' >/dev/null 2>&1 || full

# 6. run-all reason -> full (provably covers 1..14).
if echo "$json" | jq -e 'any(.recommendedTests[].reasons[]?; .kind == "run-all")' >/dev/null; then
	full
fi

# Happy path: recommendedTests[].test (flow paths) -> each flow's test-N tag.
paths="$(echo "$json" | jq -r '.recommendedTests[].test')"

# Confident zero: exit 0 + no impacted flow -> skip the whole e2e stage.
if [ -z "$paths" ]; then
	emit "[]" "false"
	exit 0
fi

# Match the same `- test-N` list-item shape assert-maestro-shards.sh / run-maestro.sh grep.
shards="$(for f in $paths; do
	grep -hoE "^[[:space:]]*-[[:space:]]*['\"]?test-[0-9]+" "$f" 2>/dev/null | grep -oE '[0-9]+'
done | sort -n -u | jq -R . | jq -cs 'map(tonumber)')"

# Defensive: impacted flows with no derivable tag -> full rather than under-select.
[ "$shards" = "[]" ] && full

emit "$shards" "true"
