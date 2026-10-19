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

  private static let sidecarSuffixesThenMain = ["-wal", "-shm", "-journal", ""]

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

  private func migrateLegacyExperimentalDatabases() {
    let fileManager = FileManager.default
    let groupDir = fileManager.groupDir()
    let legacySuffix = "-experimental.db"
    let serversLegacyName = "default\(legacySuffix)"
    guard isRegularFile(atPath: "\(groupDir)/\(serversLegacyName)"),
          let groupFiles = try? fileManager.contentsOfDirectory(atPath: groupDir) else {
      return
    }
    let legacyNames = groupFiles.filter { $0.hasSuffix(legacySuffix) && isRegularFile(atPath: "\(groupDir)/\($0)") }
    for name in legacyNames.filter({ $0 != serversLegacyName }) + [serversLegacyName] {
      let from = "\(groupDir)/\(name)"
      let to = "\(groupDir)/\(name.dropLast(legacySuffix.count)).db"
      if let size = (try? fileManager.attributesOfItem(atPath: to))?[.size] as? Int, size > 0 {
        guard name == serversLegacyName, isReplaceableServersDatabase(atPath: to) else {
          continue
        }
        discardDatabase(atPath: to)
      }
      foldWalIntoMainFile(atPath: from)
      for suffix in Self.sidecarSuffixesThenMain where fileManager.fileExists(atPath: from + suffix) {
        guard Darwin.rename(from + suffix, to + suffix) == 0 else {
          let code = errno
          fatalError("Failed to migrate \(name + suffix): errno \(code)")
        }
      }
    }
  }

  private func isRegularFile(atPath path: String) -> Bool {
    (try? FileManager.default.attributesOfItem(atPath: path))?[.type] as? FileAttributeType == .typeRegular
  }

  private func foldWalIntoMainFile(atPath path: String) {
    var database: OpaquePointer?
    defer { sqlite3_close(database) }
    guard FileManager.default.fileExists(atPath: path + "-wal"),
          sqlite3_open_v2(path, &database, SQLITE_OPEN_READWRITE, nil) == SQLITE_OK else {
      return
    }
    sqlite3_exec(database, "PRAGMA wal_checkpoint(TRUNCATE)", nil, nil, nil)
  }

  private func isReplaceableServersDatabase(atPath path: String) -> Bool {
    var database: OpaquePointer?
    defer { sqlite3_close(database) }
    guard sqlite3_open_v2(path, &database, SQLITE_OPEN_READONLY, nil) == SQLITE_OK else {
      print("Legacy database migration: could not open the target database")
      return false
    }
    var statement: OpaquePointer?
    defer { sqlite3_finalize(statement) }
    guard sqlite3_prepare_v2(database, "SELECT COUNT(*) FROM servers", -1, &statement, nil) == SQLITE_OK,
          sqlite3_step(statement) == SQLITE_ROW else {
      print("Legacy database migration: could not read servers from the target database")
      return false
    }
    return sqlite3_column_int64(statement, 0) == 0
  }

  private func discardDatabase(atPath path: String) {
    let fileManager = FileManager.default
    for suffix in Self.sidecarSuffixesThenMain where fileManager.fileExists(atPath: path + suffix) {
      do {
        try fileManager.removeItem(atPath: path + suffix)
      } catch {
        fatalError("Failed to discard \(path + suffix): \(error.localizedDescription)")
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
