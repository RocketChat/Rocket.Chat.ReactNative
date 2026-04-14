import PushKit

fileprivate let voipAppDelegateLogTag = "RocketChat.AppDelegate+Voip"

/// Shared CallKit reporting for VoIP PushKit payloads (`handle` and `localizedCallerName` may differ; often both are the caller display name).
fileprivate func reportVoipIncomingCallToCallKit(
  callUUID: String,
  handle: String,
  localizedCallerName: String,
  payload: [AnyHashable: Any],
  onReportComplete: @escaping () -> Void
) {
  RNCallKeep.reportNewIncomingCall(
    callUUID,
    handle: handle,
    handleType: "generic",
    hasVideo: false,
    localizedCallerName: localizedCallerName,
    supportsHolding: true,
    supportsDTMF: true,
    supportsGrouping: false,
    supportsUngrouping: false,
    fromPushKit: true,
    payload: payload,
    withCompletionHandler: onReportComplete
  )
}

// MARK: - PKPushRegistryDelegate

extension AppDelegate: PKPushRegistryDelegate {

  // Handle updated push credentials
  public func pushRegistry(_ registry: PKPushRegistry, didUpdate credentials: PKPushCredentials, for type: PKPushType) {
    // Register VoIP push token (a property of PKPushCredentials) with server
    VoipService.didUpdatePushCredentials(credentials, forType: type.rawValue)
  }

  public func pushRegistry(_ registry: PKPushRegistry, didInvalidatePushTokenFor type: PKPushType) {
    // The system calls this method when a previously provided push token is no longer valid for use.
    // No action is necessary on your part to reregister the push type.
    // Instead, use this method to notify your server not to send push notifications using the matching push token.
    VoipService.invalidatePushToken()
  }

  public func pushRegistry(_ registry: PKPushRegistry, didReceiveIncomingPushWith payload: PKPushPayload, for type: PKPushType, completion: @escaping () -> Void) {
    let payloadDict = payload.dictionaryPayload

    /// PushKit requires reporting to CallKit before `completion()`. For expired or unparseable payloads,
    /// report a short-lived incoming call and end it so the system is not left without a CallKit update.
    let reportPlaceholderCallAndEnd: (_ callUUID: String, _ displayName: String) -> Void = { callUUID, displayName in
      reportVoipIncomingCallToCallKit(
        callUUID: callUUID,
        handle: displayName,
        localizedCallerName: displayName,
        payload: payloadDict,
        onReportComplete: {
          RNCallKeep.endCall(withUUID: callUUID, reason: 1)
          completion()
        }
      )
    }

    guard let voipPayload = VoipPayload.fromDictionary(payloadDict) else {
      #if DEBUG
      print("[\(voipAppDelegateLogTag)] Failed to parse incoming VoIP payload: \(payloadDict)")
      #endif
      reportPlaceholderCallAndEnd(UUID().uuidString, "Rocket.Chat")
      return
    }

    let callId = voipPayload.callId
    let caller = voipPayload.caller
    guard !voipPayload.isExpired() else {
      #if DEBUG
      print("[\(voipAppDelegateLogTag)] Skipping expired or invalid VoIP payload for callId: \(callId): \(voipPayload)")
      #endif
      reportPlaceholderCallAndEnd(callId, caller)
      return
    }

    if !VoipRegion.isChina() {
      VoipService.prepareIncomingCall(voipPayload, storeEventsForJs: true)

      reportVoipIncomingCallToCallKit(
        callUUID: callId,
        handle: caller,
        localizedCallerName: caller,
        payload: payloadDict,
        onReportComplete: { completion() }
      )
    } else {
      completion()
    }
  }
}
