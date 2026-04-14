import Foundation

/// Delegate protocol for receiving call-ended events.
protocol CallEndListenerDelegate: AnyObject {
    func callEnded(id: String)
}

/// Listens for DDP stream-notify-user events indicating a call has ended on another device.
/// Deduplicates events so callEnded(id:) fires at most once per callId.
final class CallEndListener {
    weak var delegate: CallEndListenerDelegate?

    private let client: DDPClientProtocol
    private var subscriptionId: String?
    private var endedCallIds = Set<String>()
    private let lock = NSLock()

    init(client: DDPClientProtocol) {
        self.client = client
    }

    /// Start listening for call-end events for a specific callId.
    /// Calls delegate.callEnded(id:) when the server signals the call ended.
    func startListening(callId: String, host: String) {
        lock.lock()
        let isNew = endedCallIds.insert(callId).inserted
        lock.unlock()

        guard isNew else { return }

        client.onCollectionMessage = { [weak self] message in
            self?.handleCollectionMessage(message, callId: callId)
        }
    }

    /// Stop listening and clear state for this listener.
    func stop() {
        client.onCollectionMessage = nil
    }

    private func handleCollectionMessage(_ message: [String: Any], callId: String) {
        guard let collection = message["collection"] as? String,
              collection == "stream-notify-user" else { return }

        guard let fields = message["fields"] as? [String: Any],
              let eventName = fields["eventName"] as? String,
              eventName == "\(callId)/voipCall" else { return }

        // Fire callEnded exactly once per callId
        lock.lock()
        let alreadyEnded = !endedCallIds.contains(callId)
        lock.unlock()

        guard !alreadyEnded else { return }

        lock.lock()
        endedCallIds.remove(callId)
        lock.unlock()

        DispatchQueue.main.async { [weak self] in
            self?.delegate?.callEnded(id: callId)
        }
    }
}
