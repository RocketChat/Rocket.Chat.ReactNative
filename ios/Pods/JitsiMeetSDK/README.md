# Rocket.Chat

### What we have changed
`ios/sdk/src/callkit/JMCallKitProxy.swift`
```Swift
@objc public static var enabled: Bool = true {
    didSet {
        let regionCode = Locale.current.regionCode as String?
        provider.invalidate()
        if enabled && !regionCode!.contains("CN") && !regionCode!.contains("CHN") {
            guard isProviderConfigured() else  { return; }
            provider = CXProvider(configuration: providerConfiguration!)
            provider.setDelegate(emitter, queue: nil)
        } else {
            provider.setDelegate(nil, queue: nil)
        }
    }
}
```

# Jitsi Meet iOS SDK releases

This repository contains the binaries for the **[Jitsi Meet]() iOS SDK**. Each
release is tagged in this repository and is composed of 2 frameworks:

- JitsiMeet.framework
- WebRTC.framework

It is **strongly advised** to use the provided WebRTC framework and not
replace it with any other build, since the provided one is known to work
with the SDK.

## Using the SDK

The recommended way for using the SDK is by using [CocoaPods](). In order to
do so, add the `JitsiMeetSDK` dependency to your existing `Podfile` or create
a new one following this example:

```
platform :ios, '11.0'

workspace 'JitsiMeetSDKTest.xcworkspace'

target 'JitsiMeetSDKTest' do
  project 'JitsiMeetSDKTest.xcodeproj'

  pod 'JitsiMeetSDK'
end

post_install do |installer|
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      config.build_settings['ENABLE_BITCODE'] = 'NO'
    end
  end
end
```

Replace `JitsiMeetSDKTest` with your project and target names.

Bitcode is not supported, so turn it off for your project.

The SDK uses Swift code, so make sure you select `Always Embed Swift Standard Libraries`
in your project.

Since the SDK requests camera and microphone access, make sure to include the
required entries for `NSCameraUsageDescription` and `NSMicrophoneUsageDescription`
in your `Info.plist` file.

In order for app to properly work in the background, select the "audio" and "voip"
background modes.

Last, since the SDK shows and hides the status bar based on the conference state,
you may want to set `UIViewControllerBasedStatusBarAppearance` to `NO` in your
`Info.plist` file.

## API

The API is documented [here]().

## Issues

Please report all issues related to this SDK to the [Jitsi Meet]() repository.

[CocoaPods]: https://cocoapods.org
[Jitsi Meet]: https://github.com/jitsi/jitsi-meet
[here]: https://github.com/jitsi/jitsi-meet/blob/master/ios/README.md

