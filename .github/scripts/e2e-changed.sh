#!/usr/bin/env bash
set -uo pipefail

# Runs only the Maestro flows sniffler flags as impacted by the local change
# set, against an already-booted device with the app installed. Uses the same
# sniffler config as CI, but flow-granular (no shard matrix locally) and
# working-tree-aware, so an in-progress edit selects its flows before commit.
#
# Usage: pnpm e2e:changed <android|ios>
#   E2E_BASE   base ref to diff against (default: origin/develop)

PLATFORM="${1:-}"
case "$PLATFORM" in
	android) APP_ID="chat.rocket.android" OTHER_ONLY="ios-only" ;;
	ios) APP_ID="chat.rocket.ios" OTHER_ONLY="android-only" ;;
	*)
		echo "usage: pnpm e2e:changed <android|ios>" >&2
		exit 2
		;;
esac

command -v maestro >/dev/null 2>&1 || {
	echo "ERROR: maestro not found in PATH — install it and boot a device with the app." >&2
	exit 2
}

BASE="${E2E_BASE:-origin/develop}"
MERGE_BASE="$(git merge-base "$BASE" HEAD 2>/dev/null)" || {
	echo "ERROR: cannot resolve merge-base against '$BASE' — fetch it or set E2E_BASE." >&2
	exit 1
}

# Committed branch work + uncommitted tracked edits + untracked files.
# Plain read loop (not mapfile) so it runs on macOS's bash 3.2.
CHANGED=()
while IFS= read -r file; do
	[ -n "$file" ] && CHANGED+=("$file")
done < <(
	{
		git diff --name-only "$MERGE_BASE" --
		git ls-files --others --exclude-standard
	} | sort -u
)

if [ "${#CHANGED[@]}" -eq 0 ]; then
	echo "No changes vs $BASE — nothing to run."
	exit 0
fi

# sniffler selects impacted flows and appends them to the command; a confident
# zero (no impacted flow) runs nothing and exits 0. Tag excludes mirror
# run-maestro.sh so util + wrong-platform flows don't run locally.
exec pnpm exec sniffler run --changed "${CHANGED[@]}" -- \
	maestro test -e APP_ID="$APP_ID" --exclude-tags=util --exclude-tags="$OTHER_ONLY"
