import XCTest
@testable import RocketChatRN

final class CallEndListenerTests: XCTestCase {

    private var listener: CallEndListener!
    private var fakeClient: FakeDDPClient!

    override func setUp() {
        super.setUp()
        fakeClient = FakeDDPClient()
        listener = CallEndListener(client: fakeClient)
    }

    override func tearDown() {
        listener.stop()
        listener = nil
        fakeClient = nil
        super.tearDown()
    }

    func test_callEnded_firesOnce() {
        var callEndCount = 0
        listener.delegate = FakeDelegate { callId in
            callEndCount += 1
        }

        listener.startListening(callId: "call-123", host: "https://test.rocket.chat")

        fakeClient.emitCallEnded(callId: "call-123")
        fakeClient.emitCallEnded(callId: "call-123")

        XCTAssertEqual(callEndCount, 1)
    }

    func test_callEnded_differentCallIds() {
        var endedIds: [String] = []
        listener.delegate = FakeDelegate { callId in
            endedIds.append(callId)
        }

        listener.startListening(callId: "call-1", host: "https://test.rocket.chat")
        listener.startListening(callId: "call-2", host: "https://test.rocket.chat")

        fakeClient.emitCallEnded(callId: "call-1")
        fakeClient.emitCallEnded(callId: "call-2")

        XCTAssertEqual(endedIds, ["call-1", "call-2"])
    }

    func test_stop_clearsHandler() {
        var callEndCount = 0
        listener.delegate = FakeDelegate { callId in
            callEndCount += 1
        }

        listener.startListening(callId: "call-123", host: "https://test.rocket.chat")
        listener.stop()

        fakeClient.emitCallEnded(callId: "call-123")

        XCTAssertEqual(callEndCount, 0)
    }
}

// MARK: - Fake DDPClient for testing

private class FakeDDPClient: DDPClientProtocol {
    var onCollectionMessage: (([String: Any]) -> Void)?

    func connect(host: String, completion: @escaping (Bool) -> Void) {}
    func login(token: String, completion: @escaping (Bool) -> Void) {}
    func subscribe(name: String, params: [Any], completion: @escaping (Bool) -> Void) {}
    func disconnect() {}
    func callMethod(_ method: String, params: [Any], completion: @escaping (Bool) -> Void) {}
    func queueMethodCall(_ method: String, params: [Any], completion: @escaping (Bool) -> Void) {}
    func hasQueuedMethodCalls() -> Bool { false }
    func flushQueuedMethodCalls() {}
    func clearQueuedMethodCalls() {}

    func emitCallEnded(callId: String) {
        let message: [String: Any] = [
            "collection": "stream-notify-user",
            "fields": [
                "eventName": "\(callId)/voipCall"
            ]
        ]
        onCollectionMessage?(message)
    }
}

// MARK: - Fake Delegate

private class FakeDelegate: CallEndListenerDelegate {
    private let handler: (String) -> Void

    init(handler: @escaping (String) -> Void) {
        self.handler = handler
    }

    func callEnded(id: String) {
        handler(id)
    }
}
