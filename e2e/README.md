## Overview and folder structure

WIP: End-to-end tests are a work in progress and they're going to change.

```
|-- e2e
  |-- helpers
	|-- tests
	|-- data.ts
	|-- e2e_account.ts
```

- `e2e/helpers`
  - This folder contains a few functions to setup and help write tests.
- `e2e/tests`
  - This folder contains the actual test files
  - It's currently split into `assorted`, `onboarding`, `room`, and `team` folders
  - There's not a clear convention on where a test should be placed yet, but the folders above exist to try to separate them into features
  - Keep every test file truly idempotent
    - Each file can only impact on the tests written inside of it
    - They should not impact on other files, so pay attention on the data you use
- `data.ts`
  - Contains seeds to common test data, like server url, public channels, etc
  - Currently we point to https://mobile.rocket.chat as main server
    - Pointing to a local server is not recommended yet, as you would need to create a few public channels and change some permissions
    - Ideally we should point to a docker or even a mocked server, but that's tbd
  - Try not to add new data there. Use random values instead.
    - It's hard to keep track of where each value is used
- `e2e_account.ts`
  - Contains user and password with correct permissions on main server
    - Check `e2e_account.example.ts` for structure
  - It needs to be added manually on local (it's already set on CI)
    - Ask Diego Mello for credentials

## Shared config
- To start the Metro bundler in the mocked mode, you should run `yarn e2e:start`

## Setup and run iOS

- Install applesimutils
```
brew tap wix/brew
brew install applesimutils
```

### Run on debug mode
- Build the app with `yarn e2e:ios-build-debug`
- Test the app with `yarn e2e:ios-test-debug`

### Run on release mode
- Build the app with `yarn e2e:ios-build`
- Test the app with `yarn e2e:ios-test`

## Setup and run Android

- Create AVD
  - It's important to create the same emulator as on CI. Read more: https://wix.github.io/Detox/docs/guide/android-dev-env
```
sh ./scripts/create-avd.sh
```

### Run on debug mode
- Build the app with `yarn e2e:android-build-debug`
- Test the app with `yarn e2e:android-test-debug`

### Run on release mode
- Build the app with `yarn e2e:android-build`
- Test the app with `yarn e2e:android-test`