import PushKit

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
      print("Failed to parse incoming VoIP payload")
      completion()
      return
    }

    let callId = voipPayload.callId
    let caller = voipPayload.caller
    guard !voipPayload.isExpired() else {
      print("Skipping expired or invalid VoIP payload for callId: \(callId)")
      completion()
      return
    }

    VoipService.prepareIncomingCall(voipPayload)

    RNCallKeep.reportNewIncomingCall(
      callId,
      handle: caller,
      handleType: "generic",
      hasVideo: false,
      localizedCallerName: caller,
      supportsHolding: true,
      supportsDTMF: true,
      supportsGrouping: false,
      supportsUngrouping: false,
      fromPushKit: true,
      payload: payloadDict,
      withCompletionHandler: {}
    )
    completion()
  }
}
