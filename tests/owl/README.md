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
| `visual-regression.yml` | Orchestrator. `workflow_dispatch` (with an `update_baseline` toggle) + `pull_request` on owl paths. |
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

## Updating a baseline

Capture fresh prints — locally (`pnpm owl:test:update:ios`) or via the
`update_baseline` toggle in the **Visual Regression** workflow — review them, and commit
the new PNGs to the **reference repo** under `app/containers/ActionSheet/` — never here.
