# CI workflows

Maps which event triggers which workflow.

## Entrypoints

| Workflow | Trigger | What runs |
|---|---|---|
| [build-pr.yml](workflows/build-pr.yml) | `pull_request` (all branches) | Lint + tests, PR changelog, Android + iOS store builds (gated), E2E build + `e2e` runner shards on both platforms (gated; `e2e-shards` narrows to the sniffler-impacted shards, or skips the stage on a confident-zero diff) |
| [build-develop.yml](workflows/build-develop.yml) | `push: develop` | Lint + tests, release changelog, Android + iOS store builds, seeds Android AVD + SDK caches for E2E shards |
| [prettier.yml](workflows/prettier.yml) | `push: * except master, develop, single-server` (main repo) | Auto-formats with Oxfmt + Oxlint and commits any fixes back to the branch |
| [organize_translations.yml](workflows/organize_translations.yml) | `push` touching `app/i18n/locales/**.json` | Sorts JSON keys and commits the result |

## Manual gates

| Environment | Workflow / job | Fires when |
|---|---|---|
| `android_build` | [build-android.yml](workflows/build-android.yml) — `build-hold` | Called with `trigger == pr` (i.e. from `build-pr.yml`) |
| `upload_android` | [build-android.yml](workflows/build-android.yml) — `upload-hold` | Called with `trigger == pr`, after the Android build completes |
| `ios_build` | [build-ios.yml](workflows/build-ios.yml) — `build-hold` | Called with `trigger == pr` (i.e. from `build-pr.yml`) |
| `approve_e2e_testing` | [build-pr.yml](workflows/build-pr.yml) — `e2e-hold` | A `pull_request` run whose diff impacts at least one e2e test (`e2e-shards` sets `should_run == true`). A confident-zero diff skips the whole e2e stage, so no approval fires. |

## E2E secrets

The shard jobs in [e2e-android.yml](workflows/e2e-android.yml) and [e2e-ios.yml](workflows/e2e-ios.yml) read two repository secrets:

| Secret | Used for |
|---|---|
| `E2E_ACCOUNT` | Base64 of the e2e account definition; [e2e-account](actions/e2e-account/action.yml) turns it into masked `E2E_*` credential env vars |
| `CLAUDE_CODE_OAUTH_TOKEN` | Claude subscription token for the agent steps; exposed only to the run step |
