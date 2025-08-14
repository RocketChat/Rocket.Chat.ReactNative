# Maestro E2E Testing

## Overview and Folder Structure

```
|-- .maestro
    |-- helpers
    |   |-- setup.yaml
    |   |-- launch-app.yaml
    |   |-- navigate-to-login.yaml
    |-- onboarding
    |   |-- login.yaml
    |   |-- register.yaml
    |   |-- workspace.yaml
    |-- more-tests
    |   |-- test-1.yaml
    |   |-- test-2.yaml
    |   |-- test-3.yaml
    └── scripts
        ├── data-setup.js
        ├── data.js
        ├── e2e_account.js
        └── random.js
```

## Folders

### `helpers`
- Contains shared functions, YAML templates, or parameterized actions that can be reused across multiple flows
- Use this to avoid repeating common UI navigation or setup steps in different test files

### `scripts`
Contains the scripts that are going to be executed by the flows before running the tests:

#### `data.js`
- Contains seeds to common test data, like server url, public channels, etc
- Currently we point to https://mobile.rocket.chat as main server
  - Pointing to a local server is not recommended yet, as you would need to create a few public channels and change some permissions
  - Ideally we should point to a docker or even a mocked server, but that's tbd
- Try not to add new data there. Use random values instead.
  - It's hard to keep track of where each value is used

#### `e2e_account.js`
- Contains user and password with correct permissions on main server
  - Check `e2e_account.example.js` for structure
- It needs to be added manually on local (it's already set on CI)

## Prerequisites

Before running Maestro tests, you need to have your app running. You have two options:

### Option 1: Use Release Build (Recommended)
Create a release version APK or IPA file and install it on your device/simulator.

**Note**: It's good practice to use the release version for E2E testing as it closely matches the production environment.

#### Android Production Build
```bash
./gradlew bundleOfficialRelease
```

#### iOS Production Build (Simulator)
Build Experimental app for Simulator:
```bash
bundle exec fastlane build_experimental_simulator
```

### Option 2: Development Build
Start the app in development mode:
```bash
yarn android  # for Android

yarn ios      # for iOS
```

## Running Maestro Tests

Once your app is running, you can execute Maestro tests:

```bash
# Test the entire workflow
maestro test .maestro

# Test a specific file
maestro test .maestro/tests-folder-1/login.yaml
```