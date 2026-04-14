import Foundation

/// Protocol abstracting the DDP WebSocket client. Allows swapping the concrete `DDPClient`
/// with a test double in unit tests without touching call-site logic.
protocol DDPClientProtocol: AnyObject {
    func connect(host: String, completion: @escaping (Bool) -> Void)
    func login(token: String, completion: @escaping (Bool) -> Void)
    func subscribe(name: String, params: [Any], completion: @escaping (Bool) -> Void)
    func disconnect()
    func callMethod(_ method: String, params: [Any], completion: @escaping (Bool) -> Void)
    func queueMethodCall(_ method: String, params: [Any], completion: @escaping (Bool) -> Void)
    func hasQueuedMethodCalls() -> Bool
    func flushQueuedMethodCalls()
    func clearQueuedMethodCalls()
    var onCollectionMessage: (([String: Any]) -> Void)? { get set }
}
