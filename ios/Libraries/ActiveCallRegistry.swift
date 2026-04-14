import Foundation

/// Protocol for tracking active VoIP calls by callId.
protocol ActiveCallRegistryProtocol: AnyObject {
    func addCall(callId: String, payload: VoipPayload)
    func removeCall(callId: String)
    func getCall(callId: String) -> VoipPayload?
    func hasCall(callId: String) -> Bool
    func activeCallCount() -> Int
    func getAllCalls() -> [VoipPayload]
}

/// Thread-safe registry of active VoIP calls.
/// Mirrors the per-call tracking pattern of VoipPerCallDdpRegistry but for call metadata.
final class ActiveCallRegistry: ActiveCallRegistryProtocol {
    private let lock = NSLock()
    private var calls: [String: VoipPayload] = [:]

    func addCall(callId: String, payload: VoipPayload) {
        lock.lock()
        defer { lock.unlock() }
        calls[callId] = payload
    }

    func removeCall(callId: String) {
        lock.lock()
        defer { lock.unlock() }
        calls.removeValue(forKey: callId)
    }

    func getCall(callId: String) -> VoipPayload? {
        lock.lock()
        defer { lock.unlock() }
        return calls[callId]
    }

    func hasCall(callId: String) -> Bool {
        lock.lock()
        defer { lock.unlock() }
        return calls[callId] != nil
    }

    func activeCallCount() -> Int {
        lock.lock()
        defer { lock.unlock() }
        return calls.count
    }

    func getAllCalls() -> [VoipPayload] {
        lock.lock()
        defer { lock.unlock() }
        return Array(calls.values)
    }
}
