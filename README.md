# Rocket.Chat React Native Mobile

**Supported Server Versions:** 0.58.0+ (We are working to support earlier versions)

# Installing Dependencies

Follow the [React Native Getting Started Guide](https://facebook.github.io/react-native/docs/getting-started.html) for detailed instructions on setting up your local machine for development.

# Detailed configuration:

## Mac

- General requirements

    - XCode 8.3
    - Install required packages using homebrew:
      ```bash
      $ brew install watchman
      $ brew install yarn
      ```

- Clone repository and configure:
    ```bash
    $ git clone git@github.com:RocketChat/Rocket.Chat.ReactNative.git
    $ cd Rocket.Chat.ReactNative
    $ npm install
    $ npm install -g react-native-cli
    ```

- Run application
    ```bash
    $ react-native run-ios
    ```
    ```bash
    $ react-native run-android
    ```

## Linux:

- General requiriments:

  - JDK 7 or greater
  - Android SDK
  - Virtualbox
  - An Android emulator: Genymotion or Android emulator. If using genymotion ensure that it uses existing adb tools (Settings: "Use custom Android SDK Tools")
  - Install watchman (do this globally):
      ```bash
      $ git clone https://github.com/facebook/watchman.git
      $ cd watchman
      $ git checkout master
      $ ./autogen.sh
      $ ./configure make
      $ sudo make install
      ```
      Configure your kernel to accept a lot of file watches, using a command like:
      ```bash
      $ sudo sysctl -w fs.inotify.max_user_watches=1048576
      ```

- Clone repository and configure:
    ```bash
    $ git clone git@github.com:RocketChat/Rocket.Chat.ReactNative.git
    $ cd Rocket.Chat.ReactNative
    $ npm install
    $ npm install -g react-native-cli
    ```

- Run application
  - Start emulator
  - Start react packager: `$ react-native start`
  - Run in emulator: `$ react-native run-android`

# Storybook
- General requirements
    - Install storybook
        ```bash
        $ npm i -g @storybook/cli
        ```

- Running storybook
    - Run storybook application
        ```bash
        $ npm run storybook
        ```
    - Run application in other shell
        ```bash
        $ react-native run-ios
        ```
    - Running storybook on browser to help stories navigation
        ```
        open http://localhost:7007/
        ```
