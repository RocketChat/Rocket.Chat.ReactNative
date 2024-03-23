import Foundation

extension FileManager {
  func groupDir() -> String {
    let applicationGroupIdentifier = Bundle.main.string(forKey: "AppGroup")
    
    guard let path = containerURL(forSecurityApplicationGroupIdentifier: applicationGroupIdentifier)?.path else {
      return ""
    }
    
    return path
  }
}
