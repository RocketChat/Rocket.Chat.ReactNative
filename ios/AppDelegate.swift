import Expo
import React
import ReactAppDependencyProvider
import Firebase
import Bugsnag
import MMKV
import WatchConnectivity

@UIApplicationMain
public class AppDelegate: ExpoAppDelegate {
  var window: UIWindow?

//  var reactNativeDelegate: ExpoReactNativeFactoryDelegate?
  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?
  var watchConnection: WatchConnection?

  public override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    FirebaseApp.configure()
    Bugsnag.start()
    
    // Initialize MMKV with app group
    if let appGroup = Bundle.main.object(forInfoDictionaryKey: "AppGroup") as? String,
       let groupDir = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroup)?.path {
      MMKV.initialize(rootDir: nil, groupDir: groupDir, logLevel: .debug)
    }
    
    // Initialize notifications
    RNNotifications.startMonitorNotifications()
    ReplyNotification.configure()
      
    let delegate = ReactNativeDelegate()
//    let factory = ExpoReactNativeFactory(delegate: delegate)
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory
    bindReactNativeFactory(factory)

#if os(iOS) || os(tvOS)
    window = UIWindow(frame: UIScreen.main.bounds)
    factory.startReactNative(
      withModuleName: "RocketChatRN",
      in: window,
      launchOptions: launchOptions)
#endif

    let result = super.application(application, didFinishLaunchingWithOptions: launchOptions)

    // Initialize boot splash
    if let rootViewController = window?.rootViewController {
      RNBootSplash.initWithStoryboard("LaunchScreen", rootView: rootViewController.view)
    }

    // Initialize SSL Pinning
    SSLPinning().migrate()

    // Initialize Watch Connection
    watchConnection = WatchConnection(session: WCSession.default)

    return result
  }

  // Remote Notification handling
  public override func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    RNNotifications.didRegisterForRemoteNotifications(withDeviceToken: deviceToken)
  }
  
  public override func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
    RNNotifications.didFailToRegisterForRemoteNotificationsWithError(error)
  }
  
  public override func application(_ application: UIApplication, didReceiveRemoteNotification userInfo: [AnyHashable : Any], fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
    RNNotifications.didReceiveBackgroundNotification(userInfo, withCompletionHandler: completionHandler)
  }

  // Linking API
  public override func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    return super.application(app, open: url, options: options) || RCTLinkingManager.application(app, open: url, options: options)
  }

  // Universal Links
  public override func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    let result = RCTLinkingManager.application(application, continue: userActivity, restorationHandler: restorationHandler)
    return super.application(application, continue: userActivity, restorationHandler: restorationHandler) || result
  }
}

//class ReactNativeDelegate: ExpoReactNativeFactoryDelegate {
//  // Extension point for config-plugins
//
//  override func sourceURL(for bridge: RCTBridge) -> URL? {
//    // needed to return the correct URL for expo-dev-client.
//    bridge.bundleURL ?? bundleURL()
//  }
//
//  override func bundleURL() -> URL? {
//#if DEBUG
//    return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: ".expo/.virtual-metro-entry")
//#else
//    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
//#endif
//  }
//}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
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
