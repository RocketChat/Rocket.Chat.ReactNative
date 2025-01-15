import Foundation
import React

@objc(A11yEventEmitter)
class A11yEventEmitter: NSObject {

  // Exposing a method to JS
  @objc func sendAccessibilityEvent(_ message: String) {
    if let bridge = self.bridge {
      bridge.eventDispatcher().sendAppEvent(withName: "onAccessibilityEvent", body: ["message": message])
    }
  }

  // Exposing the module to JS
  @objc static func requiresMainQueueSetup() -> Bool {
    return true
  }

  @objc func constantsToExport() -> [AnyHashable: Any]! {
    return [:]
  }
}
