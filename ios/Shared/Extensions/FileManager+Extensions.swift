import Foundation

extension FileManager {
  func groupDir() -> String {
    guard let appGroup = Bundle.main.object(forInfoDictionaryKey: "AppGroupIdentifier") as? String,
          let path = containerURL(forSecurityApplicationGroupIdentifier: appGroup)?.path else {
      return ""
    }

    return path
  }
}
