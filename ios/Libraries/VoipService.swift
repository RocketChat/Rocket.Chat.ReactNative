import CallKit
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
    private struct ObservedIncomingCall {
        let payload: VoipPayload
    }

    private final class IncomingCallObserver: NSObject, CXCallObserverDelegate {
        func callObserver(_ callObserver: CXCallObserver, callChanged call: CXCall) {
            VoipService.handleObservedCallChanged(call)
        }
    }
    
    // MARK: - Constants
    
    private static let TAG = "RocketChat.VoipService"
    private static let voipTokenStorageKey = "RCVoipPushToken"
    private static let storage = MMKVBridge.build()
    
    // MARK: - Static Properties
    
    private static var initialEventsData: VoipPayload?
    private static var isVoipRegistered = false
    private static var lastVoipToken: String = loadPersistedVoipToken()
    private static var voipRegistry: PKPushRegistry?
    private static var incomingCallTimeouts: [String: DispatchWorkItem] = [:]
    private static var ddpClient: DDPClient?
    private static let callObserver = CXCallObserver()
    private static let incomingCallObserver = IncomingCallObserver()
    private static var isCallObserverConfigured = false
    private static var observedIncomingCalls: [UUID: ObservedIncomingCall] = [:]
    private static var isDdpLoggedIn = false
    /// Deduplication guard: `CXCallObserver` can call `callChanged` with `hasConnected = true`
    /// multiple times for the same call (e.g. observer re-registration, system race). This set
    /// ensures `handleNativeAccept` sends the DDP accept signal exactly once per `callId` (not a
    /// single global slot — several distinct `callId`s may be present during call-waiting).
    ///
    /// Lifecycle (per `callId`):
    ///   Added:   At the start of `handleNativeAccept()`, before any DDP call.
    ///   Removed: After native accept DDP succeeds or fails,
    ///            on call timeout (`handleIncomingCallTimeout`),
    ///            on DDP call-end signal from another device (ddp stream listener),
    ///            on CallKit call-ended observer event (only before connect — that call's entry is removed from `observedIncomingCalls` on answer).
    ///
    /// Memory: Each `callId` is tracked independently while its native accept is in flight; entries are
    /// cleared when that call's DDP accept finishes or another exit path runs for that `callId`.
    private static var nativeAcceptHandledCallIds = Set<String>()

    private enum VoipMediaCallAnswerKind {
        case accept
        case reject
    }

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

    /// Returns `true` when CXCallObserver reports any non-ended call (ringing or connected),
    /// including phone, FaceTime, and third-party VoIP.
    public static func hasActiveCall() -> Bool {
        configureCallObserverIfNeeded()
        return callObserver.calls.contains { !$0.hasEnded }
    }

    /// Prepares DDP listener and timeout for an incoming VoIP push. When `storeEventsForJs` is false
    /// (e.g. user is already on a call and we will `rejectBusyCall` immediately), skip stashing payload
    /// for `getInitialEvents` so JS does not treat an auto-rejected call as a real incoming ring.
    public static func prepareIncomingCall(_ payload: VoipPayload, storeEventsForJs: Bool = true) {
        if storeEventsForJs {
            storeInitialEvents(payload)
        }
        scheduleIncomingCallTimeout(for: payload)
        startListeningForCallEnd(payload: payload)
    }

    // MARK: - Initial Events
    
    /// Stores initial events for JS to retrieve.
    @objc
    public static func storeInitialEvents(_ payload: VoipPayload) {
        initialEventsData = payload
        
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
        
        if data.isExpired() {
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
        #if DEBUG
        print("[\(TAG)] Cleared initial events")
        #endif
    }

    // MARK: - VoIP Token

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

    // MARK: - Incoming Call Timeout

    public static func scheduleIncomingCallTimeout(for payload: VoipPayload) {
        guard let delay = payload.remainingLifetime(), delay > 0 else {
            #if DEBUG
            print("[\(TAG)] Skipping incoming call timeout for expired or invalid payload: \(payload.callId)")
            #endif
            return
        }

        cancelIncomingCallTimeout(for: payload.callId)

        let workItem = DispatchWorkItem {
            handleIncomingCallTimeout(for: payload)
        }

        incomingCallTimeouts[payload.callId] = workItem
        DispatchQueue.main.asyncAfter(deadline: .now() + delay, execute: workItem)

        #if DEBUG
        print("[\(TAG)] Scheduled incoming call timeout for \(payload.callId) in \(delay)s")
        #endif
    }

    private static func cancelIncomingCallTimeout(for callId: String) {
        incomingCallTimeouts.removeValue(forKey: callId)?.cancel()
    }

    private static func clearNativeAcceptDedupe(for callId: String) {
        nativeAcceptHandledCallIds.remove(callId)
    }

    private static func handleIncomingCallTimeout(for payload: VoipPayload) {
        incomingCallTimeouts.removeValue(forKey: payload.callId)
        clearTrackedIncomingCall(for: payload.callUUID)
        stopDDPClientInternal()
        clearNativeAcceptDedupe(for: payload.callId)

        let callId = payload.callId
        let callUUID = payload.callUUID

        configureCallObserverIfNeeded()
        guard let call = callObserver.calls.first(where: { $0.uuid == callUUID }) else {
            return
        }

        guard !call.hasConnected, !call.hasEnded else {
            return
        }

        RNCallKeep.endCall(withUUID: callId, reason: 3)
    }

    // MARK: - Native DDP Listener (Call End Detection)

    /// Opens a lightweight DDP WebSocket to detect call hangup before JS boots.
    private static func startListeningForCallEnd(payload: VoipPayload) {
        stopDDPClientInternal()

        let credentialStorage = Storage()
        guard let credentials = credentialStorage.getCredentials(server: payload.host.removeTrailingSlash()) else {
            #if DEBUG
            print("[\(TAG)] No credentials for \(payload.host), skipping DDP listener")
            #endif
            return
        }

        let callId = payload.callId
        let userId = credentials.userId
        let deviceId = DeviceUID.uid()
        let client = DDPClient()
        ddpClient = client
        isDdpLoggedIn = false
        trackIncomingCall(payload)

        #if DEBUG
        print("[\(TAG)] Starting DDP listener for call \(callId)")
        #endif

        client.onCollectionMessage = { message in
            guard ddpClient === client else {
                return
            }
            guard let fields = message["fields"] as? [String: Any],
                  let eventName = fields["eventName"] as? String,
                  eventName.hasSuffix("/media-signal"),
                  let args = fields["args"] as? [Any],
                  let firstArg = args.first as? [String: Any],
                  let signalType = firstArg["type"] as? String,
                  signalType == "notification",
                  let signalCallId = firstArg["callId"] as? String,
                  signalCallId == callId
            else {
                return
            }

            let signalNotification = firstArg["notification"] as? String
            let signedContractId = firstArg["signedContractId"] as? String

            let isHangup = signalNotification == "hangup"
            let isAcceptedOnAnotherDevice = signedContractId != nil && signedContractId != deviceId

            guard isHangup || isAcceptedOnAnotherDevice else {
                return
            }

            #if DEBUG
            print("[\(TAG)] DDP received hangup for call or accepted from another device \(callId)")
            #endif

            DispatchQueue.main.async {
                guard ddpClient === client else {
                    return
                }
                clearTrackedIncomingCall(for: payload.callUUID)
                clearNativeAcceptDedupe(for: callId)
                RNCallKeep.endCall(withUUID: callId, reason: 3)
                cancelIncomingCallTimeout(for: callId)
                stopDDPClientInternal()
            }
        }

        client.connect(host: payload.host) { connected in
            guard ddpClient === client else {
                return
            }
            guard connected else {
                #if DEBUG
                print("[\(TAG)] DDP connection failed")
                #endif
                stopDDPClientInternal()
                return
            }

            client.login(token: credentials.userToken) { loggedIn in
                guard ddpClient === client else {
                    return
                }
                guard loggedIn else {
                    #if DEBUG
                    print("[\(TAG)] DDP login failed")
                    #endif
                    stopDDPClientInternal()
                    return
                }

                isDdpLoggedIn = true
                if flushPendingQueuedSignalsIfNeeded() {
                    return
                }

                let params: [Any] = [
                    "\(userId)/media-signal",
                    ["useCollection": false, "args": [false]]
                ]

                client.subscribe(name: "stream-notify-user", params: params) { subscribed in
                    guard ddpClient === client else {
                        return
                    }
                    #if DEBUG
                    print("[\(TAG)] DDP subscribe result: \(subscribed)")
                    #endif
                    if !subscribed {
                        stopDDPClientInternal()
                    }
                }
            }
        }
    }

    /// Stops the native DDP listener. Called from JS when it takes over signaling.
    @objc
    public static func stopDDPClient() {
        #if DEBUG
        print("[\(TAG)] stopDDPClient called from JS")
        #endif
        stopDDPClientInternal()
    }

    private static func stopDDPClientInternal() {
        isDdpLoggedIn = false
        ddpClient?.clearQueuedMethodCalls()
        ddpClient?.disconnect()
        ddpClient = nil
    }

    // MARK: - Native DDP signaling (accept / reject)

    /// `contractId` must match JS `getUniqueIdSync()` from react-native-device-info (`DeviceUID` on iOS; Android uses `Settings.Secure.ANDROID_ID` in VoipNotification).
    private static func buildMediaCallAnswerParams(payload: VoipPayload, kind: VoipMediaCallAnswerKind) -> [Any]? {
        let credentialStorage = Storage()
        guard let credentials = credentialStorage.getCredentials(server: payload.host.removeTrailingSlash()) else {
            #if DEBUG
            print("[\(TAG)] Missing credentials, cannot build media-call answer params for \(payload.callId)")
            #endif
            stopDDPClientInternal()
            return nil
        }

        var signal: [String: Any] = [
            "callId": payload.callId,
            "contractId": DeviceUID.uid(),
            "type": "answer",
            "answer": kind == .accept ? "accept" : "reject"
        ]
        if kind == .accept {
            signal["supportedFeatures"] = ["audio"]
        }

        guard
            let signalData = try? JSONSerialization.data(withJSONObject: signal),
            let signalString = String(data: signalData, encoding: .utf8)
        else {
            stopDDPClientInternal()
            return nil
        }

        return ["\(credentials.userId)/media-calls", signalString]
    }

    /// Native DDP accept when the user answers via CallKit (parity with Android `VoipNotification.handleAcceptAction`).
    private static func handleNativeAccept(payload: VoipPayload) {
        if nativeAcceptHandledCallIds.contains(payload.callId) {
            return
        }
        nativeAcceptHandledCallIds.insert(payload.callId)

        cancelIncomingCallTimeout(for: payload.callId)

        let finishAccept: (Bool) -> Void = { success in
            stopDDPClientInternal()
            if success {
                storeInitialEvents(payload)
                clearNativeAcceptDedupe(for: payload.callId)
                NotificationCenter.default.post(
                    name: NSNotification.Name("VoipAcceptSucceeded"),
                    object: nil,
                    userInfo: payload.toDictionary()
                )
            } else {
                clearNativeAcceptDedupe(for: payload.callId)
                RNCallKeep.endCall(withUUID: payload.callId, reason: 6)
                let failedPayload = VoipPayload(
                    callId: payload.callId,
                    callUUID: payload.callUUID,
                    caller: payload.caller,
                    username: payload.username,
                    host: payload.host,
                    type: payload.type,
                    hostName: payload.hostName,
                    avatarUrl: payload.avatarUrl,
                    createdAt: payload.createdAt,
                    voipAcceptFailed: true
                )
                storeInitialEvents(failedPayload)
                var acceptFailedUserInfo: [String: Any] = [
                    "callId": failedPayload.callId,
                    "caller": failedPayload.caller,
                    "username": failedPayload.username,
                    "host": failedPayload.host,
                    "type": failedPayload.type,
                    "hostName": failedPayload.hostName,
                    "notificationId": failedPayload.notificationId,
                    "voipAcceptFailed": true
                ]
                if let avatarUrl = failedPayload.avatarUrl {
                    acceptFailedUserInfo["avatarUrl"] = avatarUrl
                }
                if let createdAt = failedPayload.createdAt {
                    acceptFailedUserInfo["createdAt"] = createdAt
                }
                NotificationCenter.default.post(
                    name: NSNotification.Name("VoipAcceptFailed"),
                    object: nil,
                    userInfo: acceptFailedUserInfo
                )
            }
        }

        guard let client = ddpClient else {
            #if DEBUG
            print("[\(TAG)] Native DDP client unavailable for accept \(payload.callId); relying on JS")
            #endif
            finishAccept(false)
            return
        }

        guard let params = buildMediaCallAnswerParams(payload: payload, kind: .accept) else {
            finishAccept(false)
            return
        }

        if isDdpLoggedIn {
            client.callMethod("stream-notify-user", params: params) { success in
                #if DEBUG
                print("[\(TAG)] Native accept signal result for \(payload.callId): \(success)")
                #endif
                finishAccept(success)
            }
        } else {
            client.queueMethodCall("stream-notify-user", params: params) { success in
                #if DEBUG
                print("[\(TAG)] Queued native accept signal result for \(payload.callId): \(success)")
                #endif
                finishAccept(success)
            }
            #if DEBUG
            print("[\(TAG)] Queued native accept signal for \(payload.callId)")
            #endif
        }
    }

    /// Rejects an incoming call because the user is already on another call.
    /// Must be called **after** `reportNewIncomingCall` (PushKit requirement).
    public static func rejectBusyCall(_ payload: VoipPayload) {
        cancelIncomingCallTimeout(for: payload.callId)
        clearTrackedIncomingCall(for: payload.callUUID)

        if initialEventsData?.callId == payload.callId {
            clearInitialEventsInternal()
        }

        // End the just-reported CallKit call immediately (reason 2 = unanswered / declined).
        RNCallKeep.endCall(withUUID: payload.callId, reason: 2)

        // Send reject signal via native DDP if available, otherwise queue it.
        if isDdpLoggedIn {
            sendRejectSignal(payload: payload)
        } else {
            queueRejectSignal(payload: payload)
        }

        #if DEBUG
        print("[\(TAG)] Rejected busy call \(payload.callId) — user already on a call")
        #endif
    }

    private static func sendRejectSignal(payload: VoipPayload) {
        guard let client = ddpClient else {
            #if DEBUG
            print("[\(TAG)] Native DDP client unavailable, cannot send reject for \(payload.callId)")
            #endif
            return
        }

        guard let params = buildMediaCallAnswerParams(payload: payload, kind: .reject) else {
            return
        }

        client.callMethod("stream-notify-user", params: params) { success in
            #if DEBUG
            print("[\(TAG)] Native reject signal result for \(payload.callId): \(success)")
            #endif
            stopDDPClientInternal()
        }
    }

    private static func queueRejectSignal(payload: VoipPayload) {
        guard let client = ddpClient else {
            #if DEBUG
            print("[\(TAG)] Native DDP client unavailable, cannot queue reject for \(payload.callId)")
            #endif
            return
        }

        guard let params = buildMediaCallAnswerParams(payload: payload, kind: .reject) else {
            return
        }

        client.queueMethodCall("stream-notify-user", params: params) { success in
            #if DEBUG
            print("[\(TAG)] Queued native reject signal result for \(payload.callId): \(success)")
            #endif
            stopDDPClientInternal()
        }
    }

    private static func flushPendingQueuedSignalsIfNeeded() -> Bool {
        guard let client = ddpClient, client.hasQueuedMethodCalls() else {
            return false
        }

        client.flushQueuedMethodCalls()
        return true
    }

    private static func configureCallObserverIfNeeded() {
        guard !isCallObserverConfigured else {
            return
        }

        callObserver.setDelegate(incomingCallObserver, queue: .main)
        isCallObserverConfigured = true
    }

    private static func trackIncomingCall(_ payload: VoipPayload) {
        let trackCall = {
            configureCallObserverIfNeeded()
            observedIncomingCalls[payload.callUUID] = ObservedIncomingCall(payload: payload)
        }

        if Thread.isMainThread {
            trackCall()
        } else {
            DispatchQueue.main.async(execute: trackCall)
        }
    }

    private static func clearTrackedIncomingCall(for callUUID: UUID) {
        let clearCall = {
            observedIncomingCalls.removeValue(forKey: callUUID)
        }

        if Thread.isMainThread {
            clearCall()
        } else {
            DispatchQueue.main.async(execute: clearCall)
        }
    }

    private static func handleObservedCallChanged(_ call: CXCall) {
        guard let observedCall = observedIncomingCalls[call.uuid] else {
            return
        }

        if call.hasConnected {
            observedIncomingCalls.removeValue(forKey: call.uuid)
            handleNativeAccept(payload: observedCall.payload)
            return
        }

        guard call.hasEnded else {
            return
        }

        observedIncomingCalls.removeValue(forKey: call.uuid)
        cancelIncomingCallTimeout(for: observedCall.payload.callId)
        clearNativeAcceptDedupe(for: observedCall.payload.callId)

        if isDdpLoggedIn {
            sendRejectSignal(payload: observedCall.payload)
        } else {
            queueRejectSignal(payload: observedCall.payload)
        }
    }
}
