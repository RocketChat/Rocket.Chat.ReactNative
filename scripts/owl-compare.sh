#!/bin/sh
set -e

# Owl visual-regression "run & compare" helper.
#
# What it does, in one shot:
#   1. Pulls the canonical action-sheet "prints" from the baseline reference repo
#      (OtavioStasiak/Rocket.Chat.ReactNative.VisualRegressionTest), where they live
#      under `app/containers/ActionSheet/<variant>-action-sheet-<case>.png`.
#   2. Routes the prints for the requested variant into the folder react-native-owl
#      actually reads from — `.owl/baseline/<platform>/` — since owl hardcodes that
#      path and will NOT look inside `app/containers/ActionSheet/` or any subfolder.
#   3. Runs `owl test` (compare mode) against the already-built app.
#   4. Opens the generated HTML report so you can SEE the diff.
#
# Usage:
#   scripts/owl-compare.sh ios          # default variant iphone16pro-portrait
#   scripts/owl-compare.sh android      # default variant android-portrait
#   OWL_VARIANT=iphonese-portrait scripts/owl-compare.sh ios
#
# The app must already be built for the platform (pnpm owl:build:ios / :android).

PLATFORM="${1:-}"
case "$PLATFORM" in
	ios | android) ;;
	*)
		echo "usage: scripts/owl-compare.sh ios|android" >&2
		exit 2
		;;
esac

# Variant decides both which prints to compare against and the screenshot filenames
# the test produces (it is babel-inlined into the test as process.env.OWL_VARIANT).
if [ -z "${OWL_VARIANT:-}" ]; then
	if [ "$PLATFORM" = "ios" ]; then
		OWL_VARIANT="iphone16pro-portrait"
	else
		OWL_VARIANT="android-portrait"
	fi
fi
export OWL_VARIANT

REF_REPO="${OWL_BASELINE_REPO:-https://github.com/OtavioStasiak/Rocket.Chat.ReactNative.VisualRegressionTest}"
REF_DIR=".owl/reference"
PRINTS_SUBDIR="app/containers/ActionSheet"
BASELINE_DIR=".owl/baseline/$PLATFORM"

echo "[owl-compare] platform=$PLATFORM variant=$OWL_VARIANT"

# --- 1. Fetch / refresh the reference prints --------------------------------------
PRINTS_SRC=""
if git -C "$REF_DIR" rev-parse --git-dir >/dev/null 2>&1; then
	echo "[owl-compare] refreshing reference repo at $REF_DIR"
	git -C "$REF_DIR" pull --ff-only --quiet || echo "[owl-compare] pull failed, using cached prints"
	PRINTS_SRC="$REF_DIR/$PRINTS_SUBDIR"
elif git clone --depth=1 --quiet "$REF_REPO" "$REF_DIR" 2>/dev/null; then
	echo "[owl-compare] cloned reference repo into $REF_DIR"
	PRINTS_SRC="$REF_DIR/$PRINTS_SUBDIR"
elif [ -d ".owl/baseline/ActionSheet" ]; then
	echo "[owl-compare] reference repo unreachable, falling back to local .owl/baseline/ActionSheet"
	PRINTS_SRC=".owl/baseline/ActionSheet"
else
	echo "[owl-compare] could not obtain reference prints (clone failed, no local fallback)" >&2
	exit 1
fi

# --- 2. Route this variant's prints into owl's baseline dir -----------------------
# owl reads `.owl/baseline/<platform>/<name>.png`; the prints already carry the
# variant prefix, so we copy only the files for the variant we're about to run.
rm -rf "$BASELINE_DIR"
mkdir -p "$BASELINE_DIR"
count=0
for f in "$PRINTS_SRC/$OWL_VARIANT"-*.png; do
	[ -e "$f" ] || continue
	cp "$f" "$BASELINE_DIR/"
	count=$((count + 1))
done

if [ "$count" -eq 0 ]; then
	echo "[owl-compare] no prints found for variant '$OWL_VARIANT' in $PRINTS_SRC" >&2
	echo "[owl-compare] available variants:" >&2
	ls "$PRINTS_SRC" 2>/dev/null | sed -E 's/-action-sheet-.*//' | sort -u | sed 's/^/  - /' >&2
	exit 1
fi
echo "[owl-compare] staged $count baseline print(s) into $BASELINE_DIR"

# --- 3. Run owl in compare mode ---------------------------------------------------
# OWL_VARIANT is babel-inlined AND jest-cached, so the transformed test freezes to
# the first run's value; clear the cache so this variant actually takes effect.
rm -rf .jest-cache

set +e
USE_OWL=true RUNNING_E2E_TESTS=true pnpm exec owl test --platform "$PLATFORM"
status=$?
set -e

# --- 4. Show the report -----------------------------------------------------------
REPORT=".owl/report/index.html"
if [ -f "$REPORT" ]; then
	echo "[owl-compare] report: $REPORT"
	if command -v open >/dev/null 2>&1; then
		open "$REPORT"
	fi
else
	echo "[owl-compare] no report generated at $REPORT" >&2
fi

if [ "$status" -eq 0 ]; then
	echo "[owl-compare] ✅ no visual differences"
else
	echo "[owl-compare] ❌ differences found (or test error) — see report above"
fi
exit "$status"
