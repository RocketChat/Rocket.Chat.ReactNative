import Foundation
import UIKit
import WatchConnectivity

@objc(WatchModuleImpl)
class WatchModuleImpl: NSObject {

    // MARK: - Helper

    func topViewController() -> UIViewController? {
        guard
            let scene = UIApplication.shared.connectedScenes.first
                as? UIWindowScene,
            var topController = scene.windows.first?.rootViewController
        else {
            return nil
        }
        while let presented = topController.presentedViewController {
            topController = presented
        }
        return topController
    }

    // MARK: - Sync Quick Replies

    @objc
    func syncQuickReplies() {
        DispatchQueue.main.async {
            print("Hello from WatchModule")
            let alert = UIAlertController(
                title: "Debug",
                message: "Hello",
                preferredStyle: .alert
            )
            alert.addAction(UIAlertAction(title: "OK", style: .default))
            self.topViewController()?.present(alert, animated: true)
        }
    }

    // MARK: - Watch Status

    @objc
    func isWatchAvailable() -> Bool {
        guard WCSession.isSupported() else {
            return false
        }

        let session = WCSession.default
        return session.isWatchAppInstalled && session.isPaired
    }
}
