import Foundation
import PushKit

/**
 * VoipModuleSwift - Swift implementation for VoIP push notifications and initial events data.
 * This class provides static methods called by VoipModule.mm (the TurboModule bridge).
 *
 * This module:
 * - Manages PushKit VoIP registration
 * - Tracks VoIP push tokens
 * - Stores initial events data for retrieval by JavaScript
 */
@objc(VoipService)
public final class VoipService: NSObject {
    
    // MARK: - Constants
    
    private static let TAG = "RocketChat.VoipModule"
    private static let voipTokenStorageKey = "RCVoipPushToken"
    private static let storage = MMKVBridge.build()
    
    // MARK: - Static Properties
    
    private static var initialEventsData: VoipPayload?
    private static var initialEventsTimestamp: TimeInterval = 0
    private static var isVoipRegistered = false
    private static var lastVoipToken: String = loadPersistedVoipToken()
    private static var voipRegistry: PKPushRegistry?
    
    // MARK: - Static Methods (Called from VoipModule.mm and AppDelegate)
    
    /// Registers for VoIP push notifications via PushKit
    @objc
    public static func voipRegistration() {
        if isVoipRegistered {
            #if DEBUG
            print("[\(TAG)] voipRegistration already registered. Returning lastVoipToken: \(lastVoipToken)")
            #endif
            return
        }
        
        isVoipRegistered = true
        #if DEBUG
        print("[\(TAG)] voipRegistration starting")
        #endif
        
        DispatchQueue.main.async {
            let registry = PKPushRegistry(queue: .main)
            registry.delegate = UIApplication.shared.delegate as? PKPushRegistryDelegate
            registry.desiredPushTypes = [.voIP]
            voipRegistry = registry
        }
    }
    
    /// Called from AppDelegate when push credentials are updated
    @objc
    public static func didUpdatePushCredentials(_ credentials: PKPushCredentials, forType type: String) {
        #if DEBUG
        print("[\(TAG)] didUpdatePushCredentials type: \(type)")
        #endif
        
        let tokenLength = credentials.token.count
        if tokenLength == 0 {
            return
        }
        
        // Convert token data to hex string
        let token = credentials.token.map { String(format: "%02x", $0) }.joined()

        if lastVoipToken == token {
            #if DEBUG
            print("[\(TAG)] VoIP token unchanged")
            #endif
            return
        }

        lastVoipToken = token
        persistVoipToken(token)
        
        #if DEBUG
        print("[\(TAG)] VoIP token: \(token)")
        #endif
        
        // Token will be emitted to JS via the ObjC++ bridge's event emitter
        NotificationCenter.default.post(
            name: NSNotification.Name("VoipPushTokenRegistered"),
            object: nil,
            userInfo: ["token": token]
        )
    }

    /// Called from AppDelegate when a previously registered token is invalidated
    // TODO: remove voip token from all logged in workspaces, since they share the same token
    @objc
    public static func invalidatePushToken() {
        lastVoipToken = ""
        storage.removeValue(forKey: voipTokenStorageKey)

        #if DEBUG
        print("[\(TAG)] Invalidated VoIP token")
        #endif
    }
    
    /// Called from AppDelegate when a VoIP push initial events are received
    @objc
    public static func didReceiveIncomingPush(with payload: PKPushPayload, forType type: String) {
        #if DEBUG
        print("[\(TAG)] didReceiveIncomingPush payload: \(payload.dictionaryPayload)")
        #endif
        
        guard let voipPayload = VoipPayload.fromDictionary(payload.dictionaryPayload) else {
            #if DEBUG
            print("[\(TAG)] Failed to parse VoIP payload")
            #endif
            return
        }
        
        storeInitialEvents(voipPayload)
    }
    
    /// Stores initial events for JS to retrieve.
    @objc
    public static func storeInitialEvents(_ payload: VoipPayload) {
        initialEventsData = payload
        initialEventsTimestamp = Date().timeIntervalSince1970
        
        #if DEBUG
        print("[\(TAG)] Stored initial events: \(payload.callId)")
        #endif
    }
    
    /// Gets any initial events. Returns nil if no initial events.
    @objc
    public static func getInitialEvents() -> [String: Any]? {
        guard let data = initialEventsData else {
            return nil
        }
        
        // Check if data is older than 5 minutes
        let now = Date().timeIntervalSince1970
        if now - initialEventsTimestamp > 5 * 60 {
            clearInitialEventsInternal()
            return nil
        }
        
        let result = data.toDictionary()
        clearInitialEventsInternal()
        
        return result
    }
    
    /// Clears any initial events
    @objc
    public static func clearInitialEvents() {
        clearInitialEventsInternal()
    }
    
    /// Clears initial events (internal)
    private static func clearInitialEventsInternal() {
        initialEventsData = nil
        initialEventsTimestamp = 0
        #if DEBUG
        print("[\(TAG)] Cleared initial events")
        #endif
    }
    
    /// Returns the last registered VoIP token
    @objc
    public static func getLastVoipToken() -> String {
        if lastVoipToken.isEmpty {
            lastVoipToken = loadPersistedVoipToken()
        }
        return lastVoipToken
    }

    private static func loadPersistedVoipToken() -> String {
        return storage.string(forKey: voipTokenStorageKey) ?? ""
    }

    private static func persistVoipToken(_ token: String) {
        storage.setString(token, forKey: voipTokenStorageKey)
    }
}
