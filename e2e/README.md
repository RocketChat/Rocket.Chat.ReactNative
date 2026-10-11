# E2E Testing

End-to-end tests run with [e2e](https://e2e.tester.army/docs) and its mobile engine `@e2e-dev/mobile`, which drives iOS simulators and Android emulators through agent-device.

## Folder structure

```
e2e.config.ts            targets (ios, android), permissions, agent executor
e2e/
├── agent/               step executor that runs agent steps on a Claude subscription
├── scripts/             CI helpers (account secret → env vars)
├── support/
│   ├── flows.ts         shared UI flows: launch, login, logout, rooms, messages
│   ├── api.ts           REST helpers for test data (users, rooms, teams, messages)
│   ├── data.ts          server URLs, seeded channels, account getters
│   ├── random.ts        random users and names
│   └── <area>.ts        helpers used by one test area
└── tests/<area>/**/*.e2e.ts
.e2e/cache/              committed replay cache for agent steps
```

## Test data

- Tests point at https://mobile.qa.rocket.chat (`e2e/support/data.ts`).
- Prefer random data created through `e2e/support/api.ts` over new seeds in `data.ts`. Call `afterEach(deleteCreatedUsers)` in tests that create users.
- Credentials come from environment variables:
  - `E2E_ADMIN_USER`, `E2E_ADMIN_PASSWORD`: a user with the needed permissions on the server
  - `E2E_SAML_USERNAME`, `E2E_SAML_PASSWORD`, `E2E_CAS_USERNAME`, `E2E_CAS_PASSWORD`: SAML and CAS login tests only
- To build those from an account file: `node e2e/scripts/account-env.mjs e2e_account.js > .env.e2e`, then `set -a; . ./.env.e2e; set +a`.

## Agent steps

`agent.act`, `agent.assert`, `agent.waitFor` and `agent.extract` run on Claude through the Claude Agent SDK, so they use your Claude Code login (or `CLAUDE_CODE_OAUTH_TOKEN` in CI). `E2E_CLAUDE_MODEL` picks the model (default `sonnet`).

A passing `agent.act` step is recorded in `.e2e/cache` and replays without a model call. Commit new or changed entries with the test that produced them. When CI runs a step on the model because its recording is missing, it uploads what it recorded and comments on the PR with the command that copies those entries into `.e2e/cache`. Judgments (`assert`, `waitFor`, `extract`) always call the model, so prefer locators and `expect` where they can express the check.

## Running tests

1. Build a release app: an iOS simulator `.app` or an Android `.apk`. Debug builds load JS from Metro.
2. Boot a simulator or emulator.
3. Run:

```bash
E2E_IOS_APP_PATH=/path/to/Rocket.Chat.app pnpm exec e2e run --target ios
E2E_ANDROID_APP_PATH=/path/to/app-release.apk pnpm exec e2e run --target android

pnpm exec e2e run --target ios server-history   # one file
pnpm exec e2e run --target android --tag test-5  # one CI shard
```

Optional variables: `E2E_IOS_DEVICE` (simulator name or UDID, default `iPhone 17 Pro`) and `E2E_ANDROID_DEVICE` (serial, default `emulator-5554`).

Results land in `.e2e/`: `report.json`, and per failure an accessibility tree (`failure/screen.txt`) and screenshot under `artifacts/`.

On Android emulators with Google Play services, disable autofill first, or the password manager can take over the login form: `adb shell settings put secure autofill_service null`.

## Writing tests

- Tag each test with its CI shard: `test('...', { tags: ['test-5'] }, ...)`. Platform-only tests add `platforms: ['ios']` or `platforms: ['android']`.
- Start every test from `launchApp` or `loginWithDeepLink`. On iOS they reinstall the app, since clearing app state keeps the app group container.
- Prefer `getByTestId` and exact `getByText`. A locator that matches more than one node fails; narrow it, or use `.first()` / `.last()`.
- `swipe({ direction })` uses scroll semantics: the finger moves opposite to `direction`.
- Android alert buttons are uppercase; match their names with a case-insensitive regex.
