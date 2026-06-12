# Owl visual regression — action sheets

Visual regression for the action-sheet bottom safe-area work, using
[react-native-owl](https://github.com/FormidableLabs/react-native-owl).

## Source of truth: the reference repo

Baseline "prints" are **not committed here**. They live in a separate repo —
[`OtavioStasiak/Rocket.Chat.ReactNative.VisualRegressionTest`](https://github.com/OtavioStasiak/Rocket.Chat.ReactNative.VisualRegressionTest)
— under `app/containers/ActionSheet/`, one PNG per `variant + case`:

```
<variant>-action-sheet-<case>.png
e.g. iphone16pro-portrait-action-sheet-servers-list.png
```

`variant` is `{device}-{orientation}` (`iphone16pro-portrait`, `iphonese-portrait`,
`android-portrait`, `android-landscape`); `case` is one of `servers-list`,
`directory-options`, `media-auto-download`, `user-notification-preferences`.

The test (`actionSheets.owl.tsx`) emits screenshot names in exactly that shape, so the
captured image lines up 1:1 with the reference print.

## Run & compare

```bash
# 1. Build the Owl app once (Release — required for USE_OWL inlining)
pnpm owl:build:ios          # or owl:build:android

# 2. Boot the matching simulator/emulator (CI does this for you)
xcrun simctl boot "iPhone 16 Pro"

# 3. Run the comparison and open the diff report
pnpm owl:compare:ios        # or owl:compare:android
```

`owl:compare:*` (→ `scripts/owl-compare.sh`):

1. clones/refreshes the reference repo into `.owl/reference/` (gitignored),
2. stages the prints for the current `OWL_VARIANT` into `.owl/baseline/<platform>/`
   (the only path owl reads from),
3. runs `owl test` in compare mode,
4. opens the HTML report at `.owl/report/index.html`.

Exit code is `0` when nothing changed, non-zero when a diff is found (the report still
opens so you can see it).

### Other devices / orientations

Default variant is `iphone16pro-portrait` (iOS) / `android-portrait` (Android). To
compare another, set `OWL_VARIANT` and point owl at the matching device:

```bash
# Boot the iPhone SE and set ios.device in owl.config.json to "iPhone SE (3rd generation)"
OWL_VARIANT=iphonese-portrait pnpm owl:compare:ios
```

`OWL_VARIANT` is babel-inlined and Jest-caches the transformed test; the script
`rm -rf .jest-cache` before each run so the variant actually takes effect.

## CI (GitHub Actions)

The flow mirrors e2e: build the Owl app once per platform, then fan the comparison
out over every device leg.

| Workflow | Role |
| --- | --- |
| `visual-regression.yml` | Orchestrator. `workflow_dispatch` (with an `update_baseline` toggle) + `pull_request` on owl paths. Gated behind a manual approval `hold` job (protected `approve_e2e_testing` environment, like e2e) so nothing builds until a reviewer approves. |
| `visual-regression-build-ios.yml` | Reusable — builds the Owl iOS `.app` once, uploads it. |
| `visual-regression-build-android.yml` | Reusable — builds the Owl APK once (debug-signed via the `isOwlBuild` fallback), uploads it. |
| `visual-regression-run-ios.yml` | Reusable — downloads the app, points owl at the leg's simulator, syncs baselines, compares. |
| `visual-regression-run-android.yml` | Reusable — downloads the APK, boots a Pixel 7 Pro emulator, syncs baselines, compares. |

Legs (matrix): **iPhone 16 Pro**, **iPhone SE (3rd gen)** (low-height), **Android
portrait**, **Android landscape**. Each run job downloads the prebuilt app, pulls the
matching prints from the reference repo into `.owl/baseline/<platform>/`, runs `owl
test`, and uploads `.owl/{report,diff,latest,baseline}` as an artifact per leg.

Run it from the Actions tab → **Visual Regression** → *Run workflow*. Tick
`update_baseline` to capture fresh prints instead of comparing; download the resulting
artifact and commit the PNGs to the reference repo (below).

## Baselines must be captured in CI

owl compares **pixel-exact** (it passes only when zero pixels differ; the `threshold`
option is per-pixel colour sensitivity, not a diff budget). iOS/Android simulators do
**not** render identically across machines — font hinting, sub-pixel antialiasing, a
1-px sheet offset, and even the status-bar clock format (`09:41` vs `9:41 AM`, a region
setting) all differ between a local Mac and the CI runner. So a baseline captured
locally will never match a CI render, and vice-versa.

**The golden baselines therefore have to be captured by the same CI environment that
runs the comparison.** A local `pnpm owl:compare:*` run is still useful for authoring
and quick checks against your own machine, but the prints committed to the reference
repo must come from CI.

## Updating / seeding baselines (manual)

1. Actions → **Visual Regression** → *Run workflow*, tick **`update_baseline`**.
2. When it finishes, download the **`owl-baseline-<variant>`** artifact from each leg
   (`iphone16pro-portrait`, `iphonese-portrait`, `android-portrait`,
   `android-landscape`). Each holds just the correctly-named PNGs.
3. Drop all of them into the **reference repo** under `app/containers/ActionSheet/`,
   review, and commit. They are now the source of truth — never commit baselines here.
4. Re-run **Visual Regression** in compare mode; it should be green (CI vs CI).
