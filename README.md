# Rocket.Chat Mobile

[![Project Dependencies](https://david-dm.org/RocketChat/Rocket.Chat.ReactNative.svg)](https://david-dm.org/RocketChat/Rocket.Chat.ReactNative)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/bb15e2392a71473ea59d3f634f35c54e)](https://www.codacy.com/app/RocketChat/Rocket.Chat.ReactNative?utm_source=github.com&utm_medium=referral&utm_content=RocketChat/Rocket.Chat.ReactNative&utm_campaign=badger)
[![codecov](https://codecov.io/gh/RocketChat/Rocket.Chat.ReactNative/branch/master/graph/badge.svg)](https://codecov.io/gh/RocketChat/Rocket.Chat.ReactNative)
[![CodeFactor](https://www.codefactor.io/repository/github/rocketchat/rocket.chat.reactnative/badge)](https://www.codefactor.io/repository/github/rocketchat/rocket.chat.reactnative)

- **Supported server versions:** 0.70.0+
- **Supported iOS versions**: 11+
- **Supported Android versions**: 5.0+

## Download

<a href="https://play.google.com/store/apps/details?id=chat.rocket.android">
  <img alt="Download on Google Play" src="https://play.google.com/intl/en_us/badges/images/badge_new.png" height=43>
</a>
<a href="https://apps.apple.com/us/app/rocket-chat/id1148741252">
  <img alt="Download on App Store" src="https://user-images.githubusercontent.com/7317008/43209852-4ca39622-904b-11e8-8ce1-cdc3aee76ae9.png" height=43>
</a>

Check [our docs](https://docs.rocket.chat/installation/mobile-and-desktop-apps#mobile-apps) for  beta and Experimental versions.

## Reporting an Issue

[Github Issues](https://github.com/RocketChat/Rocket.Chat.ReactNative/issues) are used to track todos, bugs, feature requests, and more.

Also check the [#react-native](https://open.rocket.chat/channel/react-native) community on [open.rocket.chat](https://open.rocket.chat). We'd like to help.

## Installing dependencies

Follow the [React Native Getting Started Guide](https://facebook.github.io/react-native/docs/getting-started.html) for detailed instructions on setting up your local machine for development.

## How to run
- Clone repository and install dependencies:
    ```bash
    $ git clone git@github.com:RocketChat/Rocket.Chat.ReactNative.git
    $ cd Rocket.Chat.ReactNative
    $ yarn
    ```

- Run application
    ```bash
    $ npx react-native run-ios
    ```
    ```bash
    $ npx react-native run-android
    ```

## Whitelabel
Do you want to make the app run on your own server only?

[Follow our whitelabel documentation](https://docs.rocket.chat/guides/developer/mobile-apps/whitelabeling-mobile-apps).

## E2E Testing
We use Detox framework to end-to-end test our app and ensure everything is working properly.

 [Follow this documentation to learn how to run it](https://github.com/RocketChat/Rocket.Chat.ReactNative/tree/develop/e2e#e2e-testing).

## Storybook
- Open index.js

- Uncomment following line

```bash
import './storybook';
```

- Comment out following lines
```bash
import './app/ReactotronConfig';
import { AppRegistry } from 'react-native';
import App from './app/index';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
```

- Start your application again

## Engage with us
### Share your story
We’d love to hear about [your experience](https://survey.zohopublic.com/zs/e4BUFG) and potentially feature it on our [Blog](https://rocket.chat/case-studies/?utm_source=github&utm_medium=readme&utm_campaign=community).

### Subscribe for Updates
Once a month our marketing team releases an email update with news about product releases, company related topics, events and use cases. [Sign Up!](https://rocket.chat/newsletter/?utm_source=github&utm_medium=readme&utm_campaign=community)
