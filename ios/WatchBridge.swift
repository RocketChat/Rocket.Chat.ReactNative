import Foundation
import React
import WatchConnectivity

@objc(WatchBridge)
final class WatchBridge: NSObject {

    @objc(syncQuickReplies:resolver:rejecter:)
    func syncQuickReplies(
        _ replies: [String],
        resolver resolve: RCTPromiseResolveBlock,
        rejecter reject: RCTPromiseRejectBlock
    ) {
            print("WatchBridge.syncData called")
         print("Value:", replies)

        guard WCSession.isSupported() else {
            resolve(false)
            return
        }

        let session = WCSession.default

        guard session.isPaired, session.isWatchAppInstalled else {
            resolve(false)
            return
        }

        do {
            try session.updateApplicationContext([
                "quickReplies": replies
            ])
            resolve(true)
        } catch {
            reject("SYNC_FAILED", error.localizedDescription, error)
        }
    }
    
    @objc(getWatchStatus:rejecter:)
        func getWatchStatus(
            resolver resolve: RCTPromiseResolveBlock,
            rejecter reject: RCTPromiseRejectBlock
        ) {
            guard WCSession.isSupported() else {
                resolve([
                    "isSupported": false,
                    "isPaired": false,
                    "isWatchAppInstalled": false
                ])
                return
            }

            let session = WCSession.default

            resolve([
                "isSupported": true,
                "isPaired": session.isPaired,
                "isWatchAppInstalled": session.isWatchAppInstalled
            ])
        }
}

extension WatchBridge: RCTBridgeModule {
    static func moduleName() -> String! { "WatchBridge" }
    static func requiresMainQueueSetup() -> Bool { false }
}
