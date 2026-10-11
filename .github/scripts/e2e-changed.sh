#!/usr/bin/env bash
set -uo pipefail

# Runs only the e2e tests sniffler flags as impacted by the local change set,
# against an already-booted device. Uses the same sniffler config as CI, but
# test-granular (no shard matrix locally) and working-tree-aware, so an
# in-progress edit selects its tests before commit.
#
# Usage: pnpm e2e:changed <android|ios>
#   E2E_BASE   base ref to diff against (default: origin/develop)

PLATFORM="${1:-}"
case "$PLATFORM" in
	android | ios) ;;
	*)
		echo "usage: pnpm e2e:changed <android|ios>" >&2
		exit 2
		;;
esac

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

# sniffler selects impacted tests and appends them to the command; a confident
# zero (no impacted test) runs nothing and exits 0.
exec pnpm exec sniffler run --changed "${CHANGED[@]}" -- \
	pnpm exec e2e run --target "$PLATFORM"
