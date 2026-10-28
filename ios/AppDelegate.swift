public import Expo
import React
import ReactAppDependencyProvider
import Firebase
import Bugsnag
import WatchConnectivity
import PushKit

@UIApplicationMain
public class AppDelegate: ExpoAppDelegate {
  public var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  public var reactNativeFactory: RCTReactNativeFactory?
  var watchConnection: WatchConnection?

  public override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    // IMPORTANT: Initialize MMKV encryption FIRST, before any other initialization
    // This reads existing encryption key or generates a new one for fresh installs
    // Must run before Firebase, Bugsnag, and React Native start
    MMKVKeyManager.initialize()
    
    FirebaseApp.configure()
    Bugsnag.start()
    ReplyNotification.configure()
    if !VoipRegion.isChina() {
      VoipService.voipRegistration()
      RNCallKeep.setup([
        "appName": "Rocket.Chat",
        "supportsVideo": false,
        "maximumCallGroups": 1,
        "maximumCallsPerCallGroup": 1,
        "includesCallsInRecents": true
      ])
    }
      
    let delegate = ReactNativeDelegate()
    let factory = ExpoReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    let result = super.application(application, didFinishLaunchingWithOptions: launchOptions)

    // Initialize SSL Pinning
     SSLPinning().migrate()

    // Initialize Watch Connection
    watchConnection = WatchConnection(session: WCSession.default)

    return result
  }
}

extension AppDelegate: ExpoReactNativeFactoryProvider {
  public var reactNativeFactoryModuleName: String {
    "RocketChatRN"
  }
}

class ReactNativeDelegate: ExpoReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
