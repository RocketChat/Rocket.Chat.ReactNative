# CI workflows

Maps which event triggers which workflow.

## Entrypoints

| Workflow | Trigger | What runs |
|---|---|---|
| [build-pr.yml](workflows/build-pr.yml) | `pull_request` (all branches) | Lint + tests, PR changelog, Android + iOS store builds (gated), E2E build + `e2e` runner shards on both platforms (gated; `e2e-shards` narrows to the sniffler-impacted shards, or skips the stage on a confident-zero diff) |
| [build-develop.yml](workflows/build-develop.yml) | `push: develop` | Lint + tests, release changelog, Android + iOS store builds, seeds Android AVD + SDK caches for E2E shards, seeds E2E native builds when the native fingerprint is new |
| [prettier.yml](workflows/prettier.yml) | `push: * except master, develop, single-server` (main repo) | Auto-formats with Oxfmt + Oxlint and commits any fixes back to the branch |
| [organize_translations.yml](workflows/organize_translations.yml) | `push` touching `app/i18n/locales/**.json` | Sorts JSON keys and commits the result |

## Manual gates

| Environment | Workflow / job | Fires when |
|---|---|---|
| `android_build` | [build-android.yml](workflows/build-android.yml) — `build-hold` | Called with `trigger == pr` (i.e. from `build-pr.yml`) |
| `open_testing_android` | [build-android.yml](workflows/build-android.yml) — `open-testing` | Called with `trigger == pr`, after the Android build completes. Approving uploads the build to the `beta` (open testing) track; until then the PR build is only on Internal App Sharing. On develop the same job uploads to `beta` without an approval. |
| `production_android` | [build-android.yml](workflows/build-android.yml) — `production`, `production-pr` | On every develop push, after `open-testing` uploads the build to `beta`: approving releases that version code to the Play production track. On PRs only for a release lane (base `master` or a `💎 release` label; the `release-lane` job in [build-pr.yml](workflows/build-pr.yml) writes "Production approval: on/off" to its summary), right after the build and independent of `open-testing`: approving uploads the AAB straight to the production track. Either way it is a full rollout that Play then reviews, and fails if the version code is lower than production's. A version code uploads once, so on a PR approve either `open_testing_android` or `production_android`, not both. |
| `ios_build` | [build-ios.yml](workflows/build-ios.yml) — `build-hold` | Called with `trigger == pr` (i.e. from `build-pr.yml`) |
| `external_users_ios` | [build-ios.yml](workflows/build-ios.yml) — `external-users` | Called with `trigger == pr`, after `upload-ios` sends the build to TestFlight. Approving distributes it to the External Testers group, which starts Beta App Review for a new version. Independent of `production`. Develop distributes externally on upload, so it has no external-users gate. |
| `production_ios` | [build-ios.yml](workflows/build-ios.yml) — `production` | After `upload-ios` sends the build to TestFlight: on every develop push, and on PRs only for a release lane (same rule as `production_android`). Approving submits it to App Store review (released automatically on approval), replacing a submission still waiting for review. Fails if the build number is lower than the newest build on App Store Connect. |
| `approve_e2e_testing` | [build-pr.yml](workflows/build-pr.yml) — `e2e-hold` | A `pull_request` run whose diff impacts at least one e2e test (`e2e-shards` sets `should_run == true`). A confident-zero diff skips the whole e2e stage, so no approval fires. |

## E2E secrets

The shard jobs in [e2e-android.yml](workflows/e2e-android.yml) and [e2e-ios.yml](workflows/e2e-ios.yml) read two repository secrets:

| Secret | Used for |
|---|---|
| `E2E_ACCOUNT` | Base64 of the e2e account definition; [e2e-account](actions/e2e-account/action.yml) turns it into masked `E2E_*` credential env vars |
| `CLAUDE_CODE_OAUTH_TOKEN` | Claude subscription token for the agent steps; exposed only to the run step |

## E2E native build cache

The E2E build workflows hash each platform's native inputs with `@expo/fingerprint` (configured in `fingerprint.config.js`). When a native build is cached under that fingerprint, the job rebuilds only the JS bundle and swaps it into the cached APK or simulator app. Otherwise it does a full native build and caches it. Patches count for both platforms unless every file they touch belongs to the other one. Android's fingerprint also hashes the images and sounds under `app/`, because they are compiled into the APK's resources; if a dependency's images differ from the cached build's, Android falls back to a full build.
