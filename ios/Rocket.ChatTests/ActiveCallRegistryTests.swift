import XCTest
@testable import RocketChatRN

final class ActiveCallRegistryTests: XCTestCase {

    private var registry: ActiveCallRegistry!

    override func setUp() {
        super.setUp()
        registry = ActiveCallRegistry()
    }

    override func tearDown() {
        registry = nil
        super.tearDown()
    }

    private func makePayload(callId: String) -> VoipPayload {
        VoipPayload(
            callId: callId,
            callUUID: UUID(uuidString: callId) ?? UUID(),
            caller: "Test Caller",
            username: "testuser",
            host: "https://test.rocket.chat",
            type: "incoming_call",
            hostName: "test-server",
            avatarUrl: nil,
            createdAt: "2026-01-01T00:00:00Z"
        )
    }

    func test_addAndGet() {
        let payload = makePayload(callId: "11111111-2222-3333-4444-555555555555")
        registry.addCall(callId: payload.callId, payload: payload)
        XCTAssertEqual(registry.getCall(callId: payload.callId)?.callId, payload.callId)
    }

    func test_hasCall() {
        let callId = "11111111-2222-3333-4444-555555555555"
        XCTAssertFalse(registry.hasCall(callId: callId))
        registry.addCall(callId: callId, payload: makePayload(callId: callId))
        XCTAssertTrue(registry.hasCall(callId: callId))
    }

    func test_removeCall() {
        let callId = "11111111-2222-3333-4444-555555555555"
        registry.addCall(callId: callId, payload: makePayload(callId: callId))
        registry.removeCall(callId: callId)
        XCTAssertFalse(registry.hasCall(callId: callId))
        XCTAssertNil(registry.getCall(callId: callId))
    }

    func test_removeCall_idempotent() {
        let callId = "11111111-2222-3333-4444-555555555555"
        registry.removeCall(callId: callId)
    }

    func test_activeCallCount() {
        registry.addCall(callId: "11111111-1111-1111-1111-111111111111", payload: makePayload(callId: "11111111-1111-1111-1111-111111111111"))
        registry.addCall(callId: "22222222-2222-2222-2222-222222222222", payload: makePayload(callId: "22222222-2222-2222-2222-222222222222"))
        XCTAssertEqual(registry.activeCallCount(), 2)
        registry.removeCall(callId: "11111111-1111-1111-1111-111111111111")
        XCTAssertEqual(registry.activeCallCount(), 1)
    }

    func test_getAllCalls() {
        let payload1 = makePayload(callId: "11111111-1111-1111-1111-111111111111")
        let payload2 = makePayload(callId: "22222222-2222-2222-2222-222222222222")
        registry.addCall(callId: payload1.callId, payload: payload1)
        registry.addCall(callId: payload2.callId, payload: payload2)
        let all = registry.getAllCalls()
        XCTAssertEqual(all.count, 2)
    }

    func test_concurrentAccess() {
        let queue = DispatchQueue(label: "test.queue", attributes: .concurrent)
        let group = DispatchGroup()
        let callId = "11111111-2222-3333-4444-555555555555"
        let payload = makePayload(callId: callId)

        for _ in 0..<100 {
            group.enter()
            queue.async {
                self.registry.addCall(callId: callId, payload: payload)
                _ = self.registry.hasCall(callId: callId)
                self.registry.removeCall(callId: callId)
                group.leave()
            }
        }

        group.wait()
        XCTAssertEqual(registry.activeCallCount(), 0)
    }
}
