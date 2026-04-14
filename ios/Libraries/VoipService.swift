import CallKit
import Foundation
import PushKit

/**
 * VoipService - Swift adapter for VoIP push notifications and call orchestration.
 *
 * This class:
 * - Manages PushKit VoIP registration
 * - Tracks VoIP push tokens
 * - Stores initial events data for retrieval by JavaScript
 * - Acts as a thin adapter between OS events (CallKit, PushKit) and CallCoordinator
 *
 * All orchestration/state logic is delegated to CallCoordinator.
 * No state machine logic remains in this class.
 */
@objc(VoipService)
public final class VoipService: NSObject {

    // MARK: - CallCoordinator Instance

    private static let coordinator = CallCoordinator()
    private static var currentState: CallState = .idle

    // MARK: - Private Constants

    private static let TAG = "RocketChat.VoipService"
    private static let voipTokenStorageKey = "RCVoipPushToken"
    private static let storage = MMKVBridge.build()

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

    // MARK: - CallKit

    private static var callObserver: CXCallObserver?
    private static var callObserverDelegate: CallObserverDelegate?
    private static var isCallObserverConfigured = false
    private static let activeCallRegistry = ActiveCallRegistry()
    private static var nativeAcceptHandledCallIds = Set<String>()

    // MARK: - REST Client

    private static let restClient: VoipRESTClientProtocol = VoipRESTClient()

    // MARK: - CallObserverDelegate

    private static final class CallObserverDelegate: NSObject, CXCallObserverDelegate {
        func callObserver(_ callObserver: CXCallObserver, callChanged call: CXCall) {
            VoipService.handleObservedCallChanged(call)
        }
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

        NotificationCenter.default.post(
            name: NSNotification.Name("VoipPushTokenRegistered"),
            object: nil,
            userInfo: ["token": token]
        )
    }

    /// Called from AppDelegate when a previously registered token is invalidated
    @objc
    public static func invalidatePushToken() {
        lastVoipToken = ""
        storage.removeValue(forKey: voipTokenStorageKey)

        #if DEBUG
        print("[\(TAG)] Invalidated VoIP token")
        #endif
    }

    /// Reports a new incoming CallKit call to the system.
    /// Called by AppDelegate+Voip when PushKit delivers a VoIP push.
    @objc
    public static func reportIncomingCall(_ payload: VoipPayload) {
        // Transition state machine
        let (newState, outputs) = coordinator.transition(state: currentState, input: .incomingPush)
        currentState = newState

        // Handle outputs
        for output in outputs {
            if output.ringOS {
                ringOS(payload: payload)
            }
        }
    }

    /// Called when the user answers a CallKit call via RNCallKeep.
    @objc
    public static func handleUserAnswer(callId: String) {
        let (newState, outputs) = coordinator.transition(state: currentState, input: .userAnswer)
        currentState = newState

        for output in outputs {
            if output.startAudio {
                startAudio()
            }
        }
    }

    /// Called when the user declines a CallKit call via RNCallKeep.
    @objc
    public static func handleUserDecline(callId: String) {
        let (newState, outputs) = coordinator.transition(state: currentState, input: .userDecline)
        currentState = newState

        for output in outputs {
            if output.endOS {
                endOS(callId: callId)
            }
        }
    }

    /// Called when DDP signals the call has ended (remote hangup or accepted on another device).
    @objc
    public static func handleRemoteHangup(callId: String) {
        let (newState, outputs) = coordinator.transition(state: currentState, input: .remoteHangup)
        currentState = newState

        for output in outputs {
            if output.endOS {
                endOS(callId: callId)
            }
        }
    }

    /// Called when JS confirms the REST accept succeeded.
    @objc
    public static func handleRestAck() {
        let (newState, _) = coordinator.transition(state: currentState, input: .restAck)
        currentState = newState
    }

    /// Called when DDP signals the call has fully ended.
    @objc
    public static func handleDdpCallEnded(callId: String) {
        let (newState, outputs) = coordinator.transition(state: currentState, input: .ddpCallEnded)
        currentState = newState

        for output in outputs {
            if output.endOS {
                endOS(callId: callId)
            }
        }
    }

    // MARK: - Output Handlers (OS Adaptation)

    private static func ringOS(payload: VoipPayload) {
        RNCallKeep.reportNewIncomingCall(
            payload.callId,
            handle: payload.caller,
            handleType: "generic",
            hasVideo: false,
            localizedCallerName: payload.caller,
            supportsHolding: true,
            supportsDTMF: true,
            supportsGrouping: false,
            supportsUngrouping: false,
            fromPushKit: true,
            payload: payload.toDictionary(),
            withCompletionHandler: {}
        )
    }

    private static func startAudio() {
        // AVAudioSession activation is handled by RNCallKeep or native modules
        // This is a placeholder for audio session setup if needed
    }

    private static func endOS(callId: String) {
        RNCallKeep.endCall(withUUID: callId, reason: 3)
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
        activeCallRegistry.removeCall(callId: payload.callUUID.uuidString)
        stopDDPClientInternal(callId: payload.callId)
        clearNativeAcceptDedupe(for: payload.callId)

        let callId = payload.callId
        let callUUID = payload.callUUID

        configureCallObserverIfNeeded()
        guard let call = callObserver?.calls.first(where: { $0.uuid == callUUID }) else {
            return
        }

        guard !call.hasConnected, !call.hasEnded else {
            return
        }

        // Notify state machine of timeout (treated as remote hangup)
        handleRemoteHangup(callId: callId)
    }

    // MARK: - CallKit Call Observer

    private static func configureCallObserverIfNeeded() {
        guard !isCallObserverConfigured else {
            return
        }

        callObserverDelegate = CallObserverDelegate()
        callObserver = CXCallObserver()
        callObserver?.setDelegate(callObserverDelegate, queue: .main)
        isCallObserverConfigured = true
    }

    private static func trackIncomingCall(_ payload: VoipPayload) {
        let trackCall = {
            configureCallObserverIfNeeded()
            activeCallRegistry.addCall(callId: payload.callUUID.uuidString, payload: payload)
        }

        if Thread.isMainThread {
            trackCall()
        } else {
            DispatchQueue.main.async(execute: trackCall)
        }
    }

    private static func handleObservedCallChanged(_ call: CXCall) {
        guard let payload = activeCallRegistry.getCall(callId: call.uuid.uuidString) else {
            return
        }

        if call.hasConnected {
            activeCallRegistry.removeCall(callId: call.uuid.uuidString)
            handleNativeAccept(payload: payload)
            return
        }

        guard call.hasEnded else {
            return
        }

        activeCallRegistry.removeCall(callId: call.uuid.uuidString)
        cancelIncomingCallTimeout(for: payload.callId)
        clearNativeAcceptDedupe(for: payload.callId)

        let endedCallId = payload.callId
        reject(payload: payload)
    }

    // MARK: - Native DDP Listener (Call End Detection)

    private static func isLiveClient(callId: String, client: DDPClientProtocol) -> Bool {
        ddpRegistry.clientFor(callId: callId) === client
    }

    /// Opens a lightweight DDP WebSocket to detect call hangup before JS boots.
    public static func startListeningForCallEnd(payload: VoipPayload) {
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
        let client: DDPClientProtocol = DDPClient()
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
                activeCallRegistry.removeCall(callId: payload.callUUID.uuidString)
                clearNativeAcceptDedupe(for: callId)
                handleRemoteHangup(callId: callId)
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

    /// Native accept when the user answers via CallKit (parity with Android `VoipNotification.handleAcceptAction`).
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

        restClient.accept(payload: payload) { success in
            DispatchQueue.main.async {
                finishAccept(success)
            }
        }
    }

    /// Rejects an incoming call because the user is already on another call.
    public static func rejectBusyCall(_ payload: VoipPayload) {
        cancelIncomingCallTimeout(for: payload.callId)
        activeCallRegistry.removeCall(callId: payload.callUUID.uuidString)

        if initialEventsData?.callId == payload.callId {
            clearInitialEventsInternal()
        }

        RNCallKeep.endCall(withUUID: payload.callId, reason: 2)

        // Send reject signal via REST
        reject(payload: payload)

        #if DEBUG
        print("[\(TAG)] Rejected busy call \(payload.callId) — user already on a call")
        #endif
    }

    private static func reject(payload: VoipPayload) {
        restClient.reject(payload: payload) { _ in
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

    // MARK: - hasActiveCall

    /// Returns `true` when CXCallObserver reports any non-ended call (ringing or connected).
    public static func hasActiveCall() -> Bool {
        configureCallObserverIfNeeded()
        return callObserver?.calls.contains { !$0.hasEnded } ?? false
    }
}
