# CI workflows

Maps which event triggers which workflow.

## Entrypoints

| Workflow | Trigger | What runs |
|---|---|---|
| [build-pr.yml](workflows/build-pr.yml) | `pull_request` (all branches) | Lint + tests, PR changelog, Android + iOS store builds (gated), E2E build + Maestro shards on both platforms (gated; `e2e-shards` narrows to the sniffler-impacted shards, or skips the stage on a confident-zero diff) |
| [build-develop.yml](workflows/build-develop.yml) | `push: develop` | Lint + tests, release changelog, Android + iOS store builds, seeds Android AVD + SDK caches for E2E shards, seeds E2E native builds when the native fingerprint is new |
| [prettier.yml](workflows/prettier.yml) | `push: * except master, develop, single-server` (main repo) | Auto-formats with Oxfmt + Oxlint and commits any fixes back to the branch |
| [organize_translations.yml](workflows/organize_translations.yml) | `push` touching `app/i18n/locales/**.json` | Sorts JSON keys and commits the result |

## Manual gates

| Environment | Workflow / job | Fires when |
|---|---|---|
| `android_build` | [build-android.yml](workflows/build-android.yml) — `build-hold` | Called with `trigger == pr` (i.e. from `build-pr.yml`) |
| `upload_android` | [build-android.yml](workflows/build-android.yml) — `upload-hold` | Called with `trigger == pr`, after the Android build completes |
| `ios_build` | [build-ios.yml](workflows/build-ios.yml) — `build-hold` | Called with `trigger == pr` (i.e. from `build-pr.yml`) |
| `approve_e2e_testing` | [build-pr.yml](workflows/build-pr.yml) — `e2e-hold` | A `pull_request` run whose diff impacts at least one Maestro flow (`e2e-shards` sets `should_run == true`). A confident-zero diff skips the whole e2e stage, so no approval fires. |

## E2E native build cache

The E2E build workflows hash each platform's native inputs with `@expo/fingerprint` (configured in `fingerprint.config.js`). When a native build is cached under that fingerprint, the job rebuilds only the JS bundle and swaps it into the cached APK or simulator app. Otherwise it does a full native build and caches it. Android also does a full build when the images the JS bundle requires differ from the cached build's.
