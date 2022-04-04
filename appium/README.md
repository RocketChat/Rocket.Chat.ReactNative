# Rocket.chat Appium integration

Project to run e2ed tests with appium.

## Running
Follow the below commands -
- Clone the project - `https://github.com/RocketChat/Rocket.Chat.ReactNative.git`.

- Go to appium folder using the same terminal - `cd appium`.

- Install dependencies using `npm i` in the terminal.

- Update the deviceName and platFormVersion in `config/android.info.js` and `config/ios.info.js` respectively.

- Update the `apps` folder with apk to run on android or set .ipa to run on ios.

- Start appium server.

- Execute `npm run ios` to run ios app.

- Execute `npm run android` to run ios app.