## Settings

- Install Node.js (Options)

  - using installer `https://nodejs.org/en/download/`
  - for mackbook - `brew install node`
  - for windows - `choco install nodejs`

- Download and install Appium from - `https://github.com/appium/appium-desktop/releases`.

- Download and install Appium inspector from - `https://github.com/appium/appium-inspector/releases` (Optional).

- install global dependencies for Appium using npm - `npm install -G appium`

## Default settings for appium inspector

- Set Remote Host to: `127.0.0.1`
- Set Remote Path to: `/wd/hub`

- And update Desired Capabilities/JSON to: 

```
{
  "platformName": "android",
  "appium:platformVersion": "12",
  "appium:deviceName": "emulator",
  "appium:automationName": "UiAutomator2",
  "appium:appPackage": "chat.rocket.reactnative",
  "appium:appActivity": "chat.rocket.reactnative.MainActivity"
}
```
