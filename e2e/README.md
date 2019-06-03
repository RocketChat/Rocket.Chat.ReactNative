### Contents:
1. [Prepare test environment](##-1.-Prepare-test-environment)
2. [Prepare test data](##-2.-Prepare-test-data)
3. [Running tests](##-3.-Running-tests)
4. [FAQ](##-FAQ)

### 1. Prepare test environment
##### 1.1. Set up local Rocket Chat server
* Install Rocket Chat meteor app by following this [guide](https://rocket.chat/docs/developer-guides/quick-start).

##### 1.2. Set up detox
* Install dependencies by following this [guide](https://github.com/wix/Detox/blob/master/docs/Introduction.GettingStarted.md#step-1-install-dependencies) (only Step 1).

### 2. Prepare test data
* Run Rocket Chat meteor app: `meteor npm start` (make sure you to run this command from project that you created on Step 1.1.).
* Open `localhost:3000` in browser.
* Sign up as admin.
* Create public room `detox-public`.
* Create user with role: `user`, username: `detoxrn`, email: `YOUR@EMAIL.COM`, password: `123`.
* Create user with role: `user`, username: `YOUR.NAME`, email: `YOUR.SECOND@EMAIL.COM`, password: `123`.
* In file `e2e/data.js` change values `existingEmail` with `YOUR.SECOND@EMAIL.COM`, `existingName` with `YOUR.NAME`.
* Login as user `detoxrn` -> open My Account -> Settings tab -> click Enable 2FA -> copy TTOLP code -> paste TTOLP code into `./e2e/data.js` file into field: `alternateUserTOTPSecret`.

### 3. Running tests
#### 3.1. iOS
* Build app with detox: `detox build -c ios.sim.release`
* Open Simulator which is used in tests (check in package.json under detox section) from Xcode and make sure that software keyboard is being displayed. To toggle keyboard press `cmd+K`.
* Run tests: `detox test -c ios.sim.release`

#### 3.1. Android
* Build app with detox: `detox build -c android.emu.debug`
* Run: `react-native start`
* Run Android emulator with name `ANDROID_API_28` via Android studio or `cd /Users/USERNAME/Library/Android/sdk/emulator/ && ./emulator -avd ANDROID_API_28`
Note: if you need to run tests on different Android emulator then simply change emulator name in ./package.json detox configurations
* Run tests: `detox test -c android.emu.debug`

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

