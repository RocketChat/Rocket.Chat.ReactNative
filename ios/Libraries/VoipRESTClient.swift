import Foundation

// MARK: - VoipRESTClientProtocol

/// Protocol abstracting the VoIP REST client for accept/reject operations.
/// Allows swapping the concrete implementation with a test double.
protocol VoipRESTClientProtocol: AnyObject {
    func accept(payload: VoipPayload, completion: @escaping (Bool) -> Void)
    func reject(payload: VoipPayload, completion: @escaping (Bool) -> Void)
}

// MARK: - VoipRESTClient

/// REST client for VoIP call accept/reject operations using Rocket.Chat's media-calls API.
final class VoipRESTClient: VoipRESTClientProtocol {

    func accept(payload: VoipPayload, completion: @escaping (Bool) -> Void) {
        guard let api = API(server: payload.host) else {
            #if DEBUG
            print("[RocketChat.VoipRESTClient] Failed to create API for host: \(payload.host)")
            #endif
            completion(false)
            return
        }

        api.fetch(request: MediaCallsAnswerRequest(
            callId: payload.callId,
            contractId: DeviceUID.uid(),
            answer: "accept",
            supportedFeatures: ["audio"]
        )) { result in
            switch result {
            case .resource(let response) where response.success:
                completion(true)
            default:
                completion(false)
            }
        }
    }

    func reject(payload: VoipPayload, completion: @escaping (Bool) -> Void) {
        guard let api = API(server: payload.host) else {
            #if DEBUG
            print("[RocketChat.VoipRESTClient] Failed to create API for host: \(payload.host)")
            #endif
            completion(false)
            return
        }

        api.fetch(request: MediaCallsAnswerRequest(
            callId: payload.callId,
            contractId: DeviceUID.uid(),
            answer: "reject",
            supportedFeatures: nil
        )) { result in
            switch result {
            case .resource(let response) where response.success:
                completion(true)
            default:
                completion(false)
            }
        }
    }
}
