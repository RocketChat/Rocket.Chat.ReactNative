import PushKit

fileprivate let voipAppDelegateLogTag = "RocketChat.AppDelegate+Voip"

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

    guard let voipPayload = VoipPayload.fromDictionary(payloadDict) else {
      #if DEBUG
      print("[\(voipAppDelegateLogTag)] Failed to parse incoming VoIP payload: \(payloadDict)")
      #endif
      completion()
      return
    }

    let callId = voipPayload.callId
    let caller = voipPayload.caller
    guard !voipPayload.isExpired() else {
      #if DEBUG
      print("[\(voipAppDelegateLogTag)] Skipping expired or invalid VoIP payload for callId: \(callId): \(voipPayload)")
      #endif
      completion()
      return
    }

    // Check BEFORE reporting — if the user is already on a call, we still must
    // report to CallKit (PushKit requirement) but will immediately reject it.
    let isBusy = VoipService.hasActiveCall()

    // Keep DDP + timeout for busy reject, but do not expose this call via getInitialEvents.
    VoipService.prepareIncomingCall(voipPayload, storeEventsForJs: !isBusy)

    RNCallKeep.reportNewIncomingCall(
      callId,
      handle: caller,
      handleType: "generic",
      hasVideo: false,
      localizedCallerName: caller,
      supportsHolding: false,
      supportsDTMF: true,
      supportsGrouping: false,
      supportsUngrouping: false,
      fromPushKit: true,
      payload: payloadDict,
      withCompletionHandler: {}
    )

    if isBusy {
      VoipService.rejectBusyCall(voipPayload)
    }

    completion()
  }
}
