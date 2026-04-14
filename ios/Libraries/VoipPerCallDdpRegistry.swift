import Foundation

/// Isolates DDP clients by `callId` so a second incoming call does not tear down the first listener.
/// Mirrors Android `VoipPerCallDdpRegistry` (see `VoipPerCallDdpRegistryTest` on Android).
final class VoipPerCallDdpRegistry<T: AnyObject> {
    private let lock = NSLock()
    private var clients: [String: T] = [:]
    private var loggedInCallIds = Set<String>()
    private let releaseClient: (T) -> Void
    private let callRegistry = ActiveCallRegistry()

    init(releaseClient: @escaping (T) -> Void) {
        self.releaseClient = releaseClient
    }

    func clientFor(callId: String) -> T? {
        lock.lock()
        defer { lock.unlock() }
        return clients[callId]
    }

    func isLoggedIn(callId: String) -> Bool {
        lock.lock()
        defer { lock.unlock() }
        return loggedInCallIds.contains(callId)
    }

    func putClient(callId: String, client: T) {
        lock.lock()
        defer { lock.unlock() }
        if let old = clients.removeValue(forKey: callId) {
            loggedInCallIds.remove(callId)
            releaseClient(old)
        }
        clients[callId] = client
    }

    func markLoggedIn(callId: String) {
        lock.lock()
        defer { lock.unlock() }
        loggedInCallIds.insert(callId)
    }

    func stopClient(callId: String) {
        lock.lock()
        defer { lock.unlock() }
        loggedInCallIds.remove(callId)
        if let c = clients.removeValue(forKey: callId) {
            releaseClient(c)
        }
    }

    func stopAllClients() {
        lock.lock()
        defer { lock.unlock() }
        loggedInCallIds.removeAll()
        clients.values.forEach(releaseClient)
        clients.removeAll()
    }

    func clientCount() -> Int {
        lock.lock()
        defer { lock.unlock() }
        return clients.count
    }

    func clientIds() -> Set<String> {
        lock.lock()
        defer { lock.unlock() }
        return Set(clients.keys)
    }

    // MARK: - ActiveCallRegistry delegation

    func addCall(callId: String, payload: VoipPayload) {
        callRegistry.addCall(callId: callId, payload: payload)
    }

    func removeCall(callId: String) {
        callRegistry.removeCall(callId: callId)
    }

    func getCall(callId: String) -> VoipPayload? {
        return callRegistry.getCall(callId: callId)
    }

    func hasCall(callId: String) -> Bool {
        return callRegistry.hasCall(callId: callId)
    }

    func activeCallCount() -> Int {
        return callRegistry.activeCallCount()
    }

    func getAllCalls() -> [VoipPayload] {
        return callRegistry.getAllCalls()
    }
}
