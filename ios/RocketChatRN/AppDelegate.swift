import UIKit
import React
import React_RCTAppDelegate
import Firebase
import Bugsnag
import MMKV
import WatchConnectivity

@main
class AppDelegate: RCTAppDelegate {
  // Preserve the watchConnection property from the Objective-C version
  var watchConnection: WatchConnection?
  
  override func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil) -> Bool {
    // Firebase configuration
    if FirebaseApp.app() == nil {
      FirebaseApp.configure()
    }
    
    // Bugsnag initialization
    Bugsnag.start()
    
    // AppGroup MMKV
    if let appGroup = Bundle.main.object(forInfoDictionaryKey: "AppGroup") as? String,
       let groupDir = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroup)?.path {
      MMKV.initialize(rootDir: nil, groupDir: groupDir, logLevel: .debug)
    }
    
    // RNNotifications setup
    RNNotifications.startMonitorNotifications()
    ReplyNotification.configure()
    
    // Set module name for React Native
    self.moduleName = "RocketChatRN"
    
    // You can add your custom initial props in the dictionary below.
    // They will be passed down to the ViewController used by React Native.
    self.initialProps = [:]
    
    // Initialize React Native
    let result = super.application(application, didFinishLaunchingWithOptions: launchOptions)
    
    // Setup boot splash
    if let rootViewController = self.window?.rootViewController {
      RNBootSplash.initWithStoryboard("LaunchScreen", rootView: rootViewController.view)
    }
    
    // SSL Pinning migration
    SSLPinning().migrate()
    
    // Initialize Watch Connection
    self.watchConnection = WatchConnection(session: WCSession.default)
    
    return result
  }
  
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    return self.bundleURL()
  }
  
  override func bundleURL() -> URL? {
    #if DEBUG
    return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
    #else
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
    #endif
  }
  
  // Notification handling
  func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    RNNotifications.didRegisterForRemoteNotifications(deviceToken: deviceToken)
  }
  
  func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
    RNNotifications.didFailToRegisterForRemoteNotifications(error: error)
  }
  
  func application(_ application: UIApplication, didReceiveRemoteNotification userInfo: [AnyHashable : Any], fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
    RNNotifications.didReceiveBackgroundNotification(userInfo, withCompletionHandler: completionHandler)
  }
  
  // URL handling
  func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey : Any] = [:]) -> Bool {
    return RCTLinkingManager.application(app, open: url, options: options)
  }
  
  // User activity handling
  func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
    return RCTLinkingManager.application(application, continue: userActivity, restorationHandler: restorationHandler)
  }
} 