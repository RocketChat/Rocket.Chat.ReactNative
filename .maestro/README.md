# Maestro E2E Testing

## Overview and Folder Structure

```
/.maestro
├── helpers
│   └── <global utility subflows>
├── scripts
│   └── <javascript test helpers>
├── tests
│   ├── onboarding
│   │   ├── login
│   │   │   ├── login.yaml
│   │   │   └── <other tests>
│   │   └── other subfeature
│   │       └── <other tests>
│   ├── teams
│   │   ├── utils
│   │   │   └── <utility subflows>
│   │   └── <teams tests>
│   └── other feature
│       ├── feature-test-1.yaml
│       └── feature-test-2.yaml
└── config.yaml
```

## Folders

### `helpers`

- Contains shared functions, YAML templates, or parameterized actions that can be reused across multiple flows
- Use this to avoid repeating common UI navigation or setup steps in different test files

### `scripts`

Contains the scripts that are going to be executed by the flows before running the tests:

#### `data.js`

- Contains seeds to common test data, like server url, public channels, etc
- Currently we point to https://mobile.qa.rocket.chat as main server
  - Pointing to a local server is not recommended yet, as you would need to create a few public channels and change some permissions
  - Ideally we should point to a docker or even a mocked server, but that's tbd
- Try not to add new data there. Use random values instead.
  - It's hard to keep track of where each value is used

#### `e2e_account.js`

- Contains user and password with correct permissions on main server
  - Check `e2e_account.example.js` for structure
- It needs to be added manually on local (it's already set on CI)

### `tests`

Contains anything Maestro should actually run and treat as "a test".

## Prerequisites

Before running Maestro tests, you need to have your app running. You have two options:

### Option 1: Use Release Build (Recommended)

Create a release version APK or IPA file and install it on your device/simulator.

**Note**: It's good practice to use the release version for E2E testing as it closely matches the production environment.

#### Android Production Build

```bash
./gradlew bundleRelease
```

### Option 2: Development Build

Start the app in development mode:
```bash
pnpm android  # for Android

pnpm ios      # for iOS
```

## Running Maestro Tests

Once your app is running, you can execute Maestro tests:

```bash
# Test the entire workflow
maestro test .maestro

# Test a specific file
maestro test .maestro/tests-folder-1/login.yaml
```

## Messages received while the device is offline (Android)

`tests/room/messages-received-while-offline.yaml` covers the messages that arrive while the app has
no connection. `setAirplaneMode: enabled` drops the socket in a live process, the messages are then
posted over REST from the host, which keeps its own network, and `assertNotVisible` proves the
device received nothing before `setAirplaneMode: disabled` lets it reconnect.

Airplane mode outlives the flow, so the flow disables it again in `onFlowComplete`, which Maestro
runs even when the flow fails.

Run it locally with `APP_ID` set, or `stopApp`, `clearState` and `launchApp` silently target a
package named `undefined` and state leaks between runs:

```bash
maestro test -e APP_ID=chat.rocket.android .maestro/tests/room/messages-received-while-offline.yaml
```

Messages are always sent by a **second account**. A same-account REST login invalidates the app's
auth token on the QA server: the app then fails `channels.history` with 401 and logs itself out,
which looks exactly like message loss. Never log in as the account the app under test is using.
