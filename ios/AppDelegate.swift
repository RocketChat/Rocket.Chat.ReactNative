import Expo
import React
import ReactAppDependencyProvider
import Firebase
import Bugsnag
import WatchConnectivity
import PushKit
import SQLite3

@UIApplicationMain
public class AppDelegate: ExpoAppDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?
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
    migrateLegacyExperimentalDatabases()
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

  private let sidecarSuffixesThenMain = ["-wal", "-shm", "-journal", ""]

  private func migrateLegacyExperimentalDatabases() {
    let fileManager = FileManager.default
    let groupDir = fileManager.groupDir()
    let legacySuffix = "-experimental.db"
    let serversLegacyName = "default\(legacySuffix)"
    guard fileManager.fileExists(atPath: "\(groupDir)/\(serversLegacyName)") else {
      return
    }
    let legacyNames = ((try? fileManager.contentsOfDirectory(atPath: groupDir)) ?? []).filter { $0.hasSuffix(legacySuffix) }
    for name in legacyNames.filter({ $0 != serversLegacyName }) + [serversLegacyName] {
      let from = "\(groupDir)/\(name)"
      let targetName = "\(name.dropLast(legacySuffix.count)).db"
      let to = "\(groupDir)/\(targetName)"
      if let size = (try? fileManager.attributesOfItem(atPath: to))?[.size] as? Int, size > 0 {
        guard name == serversLegacyName, isServersTableEmpty(atPath: to) else {
          continue
        }
        discardDatabase(named: targetName, inDirectory: groupDir)
      }
      for suffix in sidecarSuffixesThenMain where fileManager.fileExists(atPath: from + suffix) {
        guard Darwin.rename(from + suffix, to + suffix) == 0 else {
          let code = errno
          fatalError("Failed to migrate \(name + suffix): errno \(code)")
        }
      }
    }
  }

  private func isServersTableEmpty(atPath path: String) -> Bool {
    var database: OpaquePointer?
    defer { sqlite3_close(database) }
    guard sqlite3_open_v2(path, &database, SQLITE_OPEN_READWRITE, nil) == SQLITE_OK else {
      return false
    }
    var statement: OpaquePointer?
    defer { sqlite3_finalize(statement) }
    guard sqlite3_prepare_v2(database, "SELECT COUNT(*) FROM servers", -1, &statement, nil) == SQLITE_OK,
          sqlite3_step(statement) == SQLITE_ROW else {
      return false
    }
    return sqlite3_column_int64(statement, 0) == 0
  }

  private func discardDatabase(named name: String, inDirectory directory: String) {
    let fileManager = FileManager.default
    for suffix in sidecarSuffixesThenMain where fileManager.fileExists(atPath: "\(directory)/\(name)\(suffix)") {
      do {
        try fileManager.removeItem(atPath: "\(directory)/\(name)\(suffix)")
      } catch {
        fatalError("Failed to discard \(name + suffix): \(error.localizedDescription)")
      }
    }
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
