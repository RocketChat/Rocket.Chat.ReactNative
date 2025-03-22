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
}
