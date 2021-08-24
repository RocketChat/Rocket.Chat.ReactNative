# E2E Testing

## Contents

1. [Prepare test environment](##-1.-Prepare-test-environment)
2. [Prepare test data](##-2.-Prepare-test-data)
3. [Running tests](##-3.-Running-tests)
4. [FAQ](##-FAQ)

### 1. Prepare test environment

#### 1.1. A Rocket.Chat server

Either

* Install Rocket.Chat meteor app by following this [guide](https://docs.rocket.chat/guides/developer/quick-start).

Or

* Use the local Docker environment available in this folder. You can start the environment using `./e2e/docker/controlRCDemoEnv.sh startandwait`, or you can use the packaged start & run script (see step 3). Either way, you'll need [Docker](https://docs.docker.com/engine/install/) and [Docker Compose](https://docs.docker.com/compose/install/).

#### 1.2. Set up detox

* Install dependencies by following this [guide](https://github.com/wix/Detox/blob/master/docs/Introduction.GettingStarted.md#step-1-install-dependencies) (only Step 1).

### 2. Prepare test data

* If you're running your own Rocket.Chat server, ensure it's started (e.g. `meteor npm start` in the server project directory).
* Edit `e2e/data.js`:
  * Set the `server` to the address of the server under test
  * Set the `adminUser` and `adminPassword` to an admin user on that environment (or a user with at least `create-user` and `create-c`).
* Working example configs exist in `./e2e/data/`. Setting `FORCE_DEFAULT_DOCKER_DATA` to `1` in the `runTestsInDocker.sh` script will use the example config automatically

### 3. Running tests

#### 3.1. iOS

* Build app with detox: `detox build -c ios.sim.release`
* Open Simulator which is used in tests (check in package.json under detox section) from Xcode and make sure that software keyboard is being displayed. To toggle keyboard press `cmd+K`.
* Run tests: `detox test -c ios.sim.release`, or, if choosing Docker you can run the packaged environment & runner (`./e2e/docker/runTestsInDocker.sh`) which will start the Docker infrastructure, run the tests and tear it down again once done.

#### 3.2. Android

* Build app with detox: `detox build -c android.emu.debug`
* Run: `react-native start`
* Run Android emulator with name `ANDROID_API_28` via Android studio or `cd /Users/USERNAME/Library/Android/sdk/emulator/ && ./emulator -avd ANDROID_API_28`
Note: if you need to run tests on different Android emulator then simply change emulator name in ./package.json detox configurations
* Run tests: `detox test -c android.emu.debug`

#### 3.3 Running a subset of tests

Tests have been grouped into subfolders. You can choose to run just one group of tests by running, for example:

`detox test ./e2e/tests/onboarding -c ios.sim.release`

To do the same with the Docker runner:

`./e2e/docker/runTestsInDocker.sh onboarding`

### 4. FAQ

#### 4.1. Detox build fails

* Delete `node_modules`, `ios/build`, `android/build`:
`rm -rf node_modules && rm -rf ios/build && rm -rf android/build`
* Install packages: `yarn install`
* Kill metro bundler server by closing terminal or with following command: `lsof -ti:8081 | xargs kill`
* Clear metro bundler cache: `watchman watch-del-all && rm -rf $TMPDIR/react-native-packager-cache-* &&  rm -rf $TMPDIR/metro-bundler-cache-*`
* Make sure you have all required [environment](##-1.-Prepare-test-environment).
* Now try building again with `detox build` (with specific configuration).

#### 4.2. Detox iOS test run fails

* Check if your meteor app is running by opening `localhost:3000` in browser.
* Make sure software keyboard is displayed in simulator when focusing some input. To enable keyboard press `cmd+K`.
* Make sure you have prepared all [test data](##-2.-Prepare-test-data).
* Sometimes detox e2e tests fail for no reason so all you can do is simply re-run again.

### 5. Todo

* TOTP test
* Push notifications
* Deep linking
* Intermittent connectivity
