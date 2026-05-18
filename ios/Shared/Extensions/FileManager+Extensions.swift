import Foundation

extension FileManager {
  func groupDir() -> String {
    let applicationGroupIdentifier = Bundle.main.string(forKey: "AppGroupIdentifier")
    guard let path = containerURL(forSecurityApplicationGroupIdentifier: applicationGroupIdentifier)?.path else {
      return ""
    }
    
    return path
  }
}
