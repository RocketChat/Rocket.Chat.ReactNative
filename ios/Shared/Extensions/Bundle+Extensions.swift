import Foundation

extension Bundle {
  func bool(forKey key: String) -> Bool {
    object(forInfoDictionaryKey: key) as? Bool ?? false
  }
  
  func string(forKey key: String) -> String {
    guard let string = object(forInfoDictionaryKey: key) as? String else {
      fatalError("Could not locate string for key \(key).")
    }
    
    return string
  }
  
  /// Returns User-Agent string for API requests: "RC Mobile; ios {version}; v{appVersion} ({build})"
  static var userAgent: String {
    let osVersion = ProcessInfo.processInfo.operatingSystemVersion
    let systemVersion = "\(osVersion.majorVersion).\(osVersion.minorVersion)"
    let appVersion = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "unknown"
    let buildNumber = Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "unknown"
    return "RC Mobile; ios \(systemVersion); v\(appVersion) (\(buildNumber))"
  }
}
