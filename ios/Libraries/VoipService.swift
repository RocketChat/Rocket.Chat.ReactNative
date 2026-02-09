import Foundation
import PushKit

/**
 * VoipModuleSwift - Swift implementation for VoIP push notifications and pending call data.
 * This class provides static methods called by VoipModule.mm (the TurboModule bridge).
 *
 * This module:
 * - Manages PushKit VoIP registration
 * - Tracks VoIP push tokens
 * - Stores pending VoIP call data for retrieval by JavaScript
 */
@objc(VoipService)
public final class VoipService: NSObject {
    
    // MARK: - Constants
    
    private static let TAG = "RocketChat.VoipModule"
    
    // MARK: - Static Properties
    
    private static var pendingVoipCallData: VoipPayload?
    private static var pendingVoipCallTimestamp: TimeInterval = 0
    private static var isVoipRegistered = false
    private static var lastVoipToken: String = ""
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
        lastVoipToken = token
        
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
    
    /// Called from AppDelegate when a VoIP push is received
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
        
        storePendingVoipCall(voipPayload)
    }
    
    /// Stores VoIP call data for JS to retrieve.
    @objc
    public static func storePendingVoipCall(_ payload: VoipPayload) {
        pendingVoipCallData = payload
        pendingVoipCallTimestamp = Date().timeIntervalSince1970
        
        #if DEBUG
        print("[\(TAG)] Stored pending VoIP call: \(payload.callId)")
        #endif
        
        // Emit event via notification (the ObjC++ bridge observes this)
        NotificationCenter.default.post(
            name: NSNotification.Name("VoipCallAccepted"),
            object: nil,
            userInfo: payload.toDictionary()
        )
    }
    
    /// Gets any pending VoIP call data. Returns nil if no pending call.
    @objc
    public static func getPendingVoipCall() -> [String: Any]? {
        guard let data = pendingVoipCallData else {
            return nil
        }
        
        // Check if data is older than 5 minutes
        let now = Date().timeIntervalSince1970
        if now - pendingVoipCallTimestamp > 5 * 60 {
            clearPendingVoipCallInternal()
            return nil
        }
        
        let result = data.toDictionary()
        clearPendingVoipCallInternal()
        
        return result
    }
    
    /// Clears any pending VoIP call data
    @objc
    public static func clearPendingVoipCall() {
        clearPendingVoipCallInternal()
    }
    
    /// Clears pending VoIP call data (internal)
    private static func clearPendingVoipCallInternal() {
        pendingVoipCallData = nil
        pendingVoipCallTimestamp = 0
        #if DEBUG
        print("[\(TAG)] Cleared pending VoIP call data")
        #endif
    }
    
    /// Returns the last registered VoIP token
    @objc
    public static func getLastVoipToken() -> String {
        return lastVoipToken
    }
}

// MARK: - VoipPayload

/// Data structure for VoIP call payload
@objc(VoipPayload)
public class VoipPayload: NSObject {
    @objc public let callId: String
    @objc public let caller: String
    @objc public let host: String
    @objc public let type: String
    
    @objc public var notificationId: Int {
        return callId.hashValue
    }
    
    @objc public var callUUID: String {
        return CallIdUUID.generateUUIDv5(from: callId)
    }
    
    @objc
    public init(callId: String, caller: String, host: String, type: String) {
        self.callId = callId
        self.caller = caller
        self.host = host
        self.type = type
        super.init()
    }
    
    @objc
    public func isVoipIncomingCall() -> Bool {
        return type == "incoming_call" && !callId.isEmpty && !caller.isEmpty && !host.isEmpty
    }
    
    @objc
    public func toDictionary() -> [String: Any] {
        return [
            "callId": callId,
            "caller": caller,
            "host": host,
            "type": type,
            "callUUID": callUUID,
            "notificationId": notificationId
        ]
    }
    
    @objc
    public static func fromDictionary(_ dict: [AnyHashable: Any]) -> VoipPayload? {
        guard let type = dict["type"] as? String,
              let callId = dict["callId"] as? String,
              type == "incoming_call",
              !callId.isEmpty else {
            return nil
        }
        
        let caller = dict["caller"] as? String ?? ""
        let host = dict["host"] as? String ?? ""
        
        return VoipPayload(callId: callId, caller: caller, host: host, type: type)
    }
}
