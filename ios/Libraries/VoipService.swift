import CallKit
import Foundation
import PushKit

/**
 * VoipModuleSwift - Swift implementation for VoIP push notifications and initial events data.
 * This class provides static methods called by VoipModule.mm (the TurboModule bridge).
 *
 * Threading:
 * - `lastVoipToken` and `initialEventsData` are synchronized on `bridgeStateQueue` because they are
 *   written on the main thread (PushKit, native call flows) and read from the React Native bridge thread.
 * - **All other static state is main-thread-only** (PushKit registry on `.main`, `CXCallObserver` on
 *   `.main`, and `trackIncomingCall` / `clearTrackedIncomingCall` already bounce work to main where needed).
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
    /// Serializes access to `lastVoipToken` and `initialEventsData` (main-thread writers vs RN bridge readers).
    private static let bridgeStateQueue = DispatchQueue(label: "chat.rocket.ios.voipService.bridgeState")

    // MARK: - Static Properties
    
    private static var initialEventsData: VoipPayload?
    private static var isVoipRegistered = false
    private static var lastVoipToken: String = loadPersistedVoipToken()
    private static var voipRegistry: PKPushRegistry?
    private static var incomingCallTimeouts: [String: DispatchWorkItem] = [:]
    private static let ddpRegistry = VoipPerCallDdpRegistry<DDPClient> { client in
        client.clearQueuedMethodCalls()
        client.disconnect()
    }
    private static let callObserver = CXCallObserver()
    private static let incomingCallObserver = IncomingCallObserver()
    private static var isCallObserverConfigured = false
    private static var observedIncomingCalls: [UUID: ObservedIncomingCall] = [:]
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

    // MARK: - Static Methods (Called from VoipModule.mm and AppDelegate)
    
    /// Registers for VoIP push notifications via PushKit
    @objc
    public static func voipRegistration() {
        if isVoipRegistered {
            #if DEBUG
            let tokenSnapshot = bridgeStateQueue.sync { lastVoipToken }
            print("[\(TAG)] voipRegistration already registered. Returning lastVoipToken: \(tokenSnapshot)")
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

        let tokenUnchanged = bridgeStateQueue.sync { () -> Bool in
            if lastVoipToken == token {
                return true
            }
            lastVoipToken = token
            return false
        }

        if tokenUnchanged {
            #if DEBUG
            print("[\(TAG)] VoIP token unchanged")
            #endif
            return
        }

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
        bridgeStateQueue.sync {
            lastVoipToken = ""
        }
        storage.removeValue(forKey: voipTokenStorageKey)

        #if DEBUG
        print("[\(TAG)] Invalidated VoIP token")
        #endif
    }

    /// Returns `true` when CXCallObserver reports any non-ended call (ringing or connected),
    /// including phone, FaceTime, and third-party VoIP.
    ///
    /// **Call-waiting (current `AppDelegate+Voip` behavior):** This is **not** called from the PushKit
    /// path; CallKit handles multiple simultaneous calls. Kept for parity with Android busy detection,
    /// documentation of `prepareIncomingCall(_:storeEventsForJs:)`, and optional future or test use.
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
        bridgeStateQueue.sync {
            initialEventsData = payload

            #if DEBUG
            print("[\(TAG)] Stored initial events: \(payload.callId)")
            #endif
        }
    }

    /// Gets any initial events. Returns nil if no initial events.
    @objc
    public static func getInitialEvents() -> [String: Any]? {
        bridgeStateQueue.sync {
            guard let data = initialEventsData else {
                return nil
            }

            if data.isExpired() {
                clearInitialEventsUnlocked()
                return nil
            }

            let result = data.toDictionary()
            clearInitialEventsUnlocked()

            return result
        }
    }

    /// Clears any initial events
    @objc
    public static func clearInitialEvents() {
        bridgeStateQueue.sync {
            clearInitialEventsUnlocked()
        }
    }

    /// Clears initial events. Caller must already be running on `bridgeStateQueue`.
    private static func clearInitialEventsUnlocked() {
        initialEventsData = nil
        #if DEBUG
        print("[\(TAG)] Cleared initial events")
        #endif
    }

    // MARK: - VoIP Token

    /// Returns the last registered VoIP token
    @objc
    public static func getLastVoipToken() -> String {
        let current = bridgeStateQueue.sync { lastVoipToken }
        if !current.isEmpty {
            return current
        }
        let persisted = loadPersistedVoipToken()
        return bridgeStateQueue.sync {
            if lastVoipToken.isEmpty {
                lastVoipToken = persisted
            }
            return lastVoipToken
        }
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
        stopDDPClientInternal(callId: payload.callId)
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

    private static func isLiveClient(callId: String, client: DDPClient) -> Bool {
        ddpRegistry.clientFor(callId: callId) === client
    }

    /// Opens a lightweight DDP WebSocket to detect call hangup before JS boots.
    private static func startListeningForCallEnd(payload: VoipPayload) {
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
        ddpRegistry.putClient(callId: callId, client: client)
        trackIncomingCall(payload)

        #if DEBUG
        print("[\(TAG)] Starting DDP listener for call \(callId)")
        #endif

        client.onCollectionMessage = { message in
            guard isLiveClient(callId: callId, client: client) else {
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
                guard isLiveClient(callId: callId, client: client) else {
                    return
                }
                clearTrackedIncomingCall(for: payload.callUUID)
                clearNativeAcceptDedupe(for: callId)
                RNCallKeep.endCall(withUUID: callId, reason: 3)
                cancelIncomingCallTimeout(for: callId)
                stopDDPClientInternal(callId: callId)
            }
        }

        client.connect(host: payload.host) { connected in
            guard isLiveClient(callId: callId, client: client) else {
                return
            }
            guard connected else {
                #if DEBUG
                print("[\(TAG)] DDP connection failed")
                #endif
                stopDDPClientInternal(callId: callId)
                return
            }

            client.login(token: credentials.userToken) { loggedIn in
                guard isLiveClient(callId: callId, client: client) else {
                    return
                }
                guard loggedIn else {
                    #if DEBUG
                    print("[\(TAG)] DDP login failed")
                    #endif
                    stopDDPClientInternal(callId: callId)
                    return
                }

                ddpRegistry.markLoggedIn(callId: callId)
                if flushPendingQueuedSignalsIfNeeded(callId: callId) {
                    return
                }

                let params: [Any] = [
                    "\(userId)/media-signal",
                    ["useCollection": false, "args": [false]]
                ]

                client.subscribe(name: "stream-notify-user", params: params) { subscribed in
                    guard isLiveClient(callId: callId, client: client) else {
                        return
                    }
                    #if DEBUG
                    print("[\(TAG)] DDP subscribe result: \(subscribed)")
                    #endif
                    if !subscribed {
                        stopDDPClientInternal(callId: callId)
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

    private static func stopDDPClientInternal(callId: String) {
        ddpRegistry.stopClient(callId: callId)
    }

    private static func stopDDPClientInternal() {
        ddpRegistry.stopAllClients()
    }

    /// Native DDP accept when the user answers via CallKit (parity with Android `VoipNotification.handleAcceptAction`).
    private static func handleNativeAccept(payload: VoipPayload) {
        if nativeAcceptHandledCallIds.contains(payload.callId) {
            return
        }
        nativeAcceptHandledCallIds.insert(payload.callId)

        cancelIncomingCallTimeout(for: payload.callId)

        let finishAccept: (Bool) -> Void = { success in
            stopDDPClientInternal(callId: payload.callId)
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

        guard let api = API(server: payload.host) else {
            #if DEBUG
            print("[\(TAG)] Failed to create API for host: \(payload.host)")
            #endif
            finishAccept(false)
            return
        }

        api.fetch(request: MediaCallsAnswerRequest(
            callId: payload.callId,
            contractId: DeviceUID.uid(),
            answer: "accept",
            supportedFeatures: ["audio"]
        )) { result in
            DispatchQueue.main.async {
                switch result {
                case .resource(let response) where response.success:
                    finishAccept(true)
                default:
                    finishAccept(false)
                }
            }
        }
    }

    /// Rejects an incoming call because the user is already on another call.
    /// Must be called **after** `reportNewIncomingCall` (PushKit requirement).
    ///
    /// **Call-waiting:** `AppDelegate+Voip` does **not** invoke this; second rings are shown in CallKit
    /// instead of auto-rejecting. Same rationale as `hasActiveCall()` — API remains for Android-aligned
    /// flows, `storeEventsForJs: false` cleanup, and future wiring.
    public static func rejectBusyCall(_ payload: VoipPayload) {
        cancelIncomingCallTimeout(for: payload.callId)
        clearTrackedIncomingCall(for: payload.callUUID)

        bridgeStateQueue.sync {
            if initialEventsData?.callId == payload.callId {
                clearInitialEventsUnlocked()
            }
        }

        // End the just-reported CallKit call immediately (reason 2 = unanswered / declined).
        RNCallKeep.endCall(withUUID: payload.callId, reason: 2)

        // Send reject signal via REST
        reject(payload: payload)

        #if DEBUG
        print("[\(TAG)] Rejected busy call \(payload.callId) — user already on a call")
        #endif
    }

    private static func reject(payload: VoipPayload) {
        guard let api = API(server: payload.host) else {
            #if DEBUG
            print("[\(TAG)] Failed to create API for reject: \(payload.host)")
            #endif
            stopDDPClientInternal(callId: payload.callId)
            return
        }

        api.fetch(request: MediaCallsAnswerRequest(
            callId: payload.callId,
            contractId: DeviceUID.uid(),
            answer: "reject",
            supportedFeatures: nil
        )) { _ in
            self.stopDDPClientInternal(callId: payload.callId)
        }
    }

    private static func flushPendingQueuedSignalsIfNeeded(callId: String) -> Bool {
        guard let client = ddpRegistry.clientFor(callId: callId), client.hasQueuedMethodCalls() else {
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
        let clearCall: () -> Void = {
            _ = observedIncomingCalls.removeValue(forKey: callUUID)
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

        let endedCallId = observedCall.payload.callId
        observedIncomingCalls.removeValue(forKey: call.uuid)
        cancelIncomingCallTimeout(for: endedCallId)
        clearNativeAcceptDedupe(for: endedCallId)

        RNCallKeep.endCall(withUUID: endedCallId, reason: 3)
        reject(payload: observedCall.payload)
    }
}
