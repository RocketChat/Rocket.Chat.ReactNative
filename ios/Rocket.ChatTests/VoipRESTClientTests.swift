import XCTest
@testable import RocketChatRN

// MARK: - FakeVoipRESTClient

final class FakeVoipRESTClient: VoipRESTClientProtocol {
    var acceptCalled = false
    var acceptCallCount = 0
    var rejectCalled = false
    var rejectCallCount = 0
    var lastAcceptPayload: VoipPayload?
    var lastRejectPayload: VoipPayload?
    var acceptResult: Bool = true
    var rejectResult: Bool = true
    var acceptCompletion: ((Bool) -> Void)?
    var rejectCompletion: ((Bool) -> Void)?

    func accept(payload: VoipPayload, completion: @escaping (Bool) -> Void) {
        acceptCalled = true
        acceptCallCount += 1
        lastAcceptPayload = payload
        if let acceptCompletion = acceptCompletion {
            acceptCompletion(acceptResult)
        }
        completion(acceptResult)
    }

    func reject(payload: VoipPayload, completion: @escaping (Bool) -> Void) {
        rejectCalled = true
        rejectCallCount += 1
        lastRejectPayload = payload
        if let rejectCompletion = rejectCompletion {
            rejectCompletion(rejectResult)
        }
        completion(rejectResult)
    }
}

// MARK: - VoipRESTClientTests

final class VoipRESTClientTests: XCTestCase {

    private let validHost = "my-server.rocket.chat"

    private func makePayload(callId: String = "test-call-id") -> VoipPayload {
        VoipPayload(
            callId: callId,
            callUUID: UUID(),
            caller: "John Doe",
            username: "johndoe",
            host: validHost,
            type: "incoming_call",
            hostName: "my-server",
            avatarUrl: nil,
            createdAt: nil,
            voipAcceptFailed: false
        )
    }

    // MARK: - Protocol Conformance

    func testVoipRESTClientImplementsProtocol() {
        let client: VoipRESTClientProtocol = VoipRESTClient()
        XCTAssertNotNil(client)
    }

    func testFakeClientCanBeUsedAsProtocol() {
        let client: VoipRESTClientProtocol = FakeVoipRESTClient()
        XCTAssertNotNil(client)
    }

    // MARK: - Fake Client Behavior

    func testFakeAcceptIsCalled() {
        let fake = FakeVoipRESTClient()
        let payload = makePayload()

        fake.accept(payload: payload) { _ in }

        XCTAssertTrue(fake.acceptCalled)
        XCTAssertEqual(fake.acceptCallCount, 1)
        XCTAssertEqual(fake.lastAcceptPayload?.callId, payload.callId)
    }

    func testFakeRejectIsCalled() {
        let fake = FakeVoipRESTClient()
        let payload = makePayload()

        fake.reject(payload: payload) { _ in }

        XCTAssertTrue(fake.rejectCalled)
        XCTAssertEqual(fake.rejectCallCount, 1)
        XCTAssertEqual(fake.lastRejectPayload?.callId, payload.callId)
    }

    func testFakeAcceptCompletionCalled() {
        let fake = FakeVoipRESTClient()
        fake.acceptResult = false
        let payload = makePayload()
        var completionResult: Bool?

        fake.accept(payload: payload) { result in
            completionResult = result
        }

        XCTAssertEqual(completionResult, false)
    }

    func testFakeRejectCompletionCalled() {
        let fake = FakeVoipRESTClient()
        fake.rejectResult = false
        let payload = makePayload()
        var completionResult: Bool?

        fake.reject(payload: payload) { result in
            completionResult = result
        }

        XCTAssertEqual(completionResult, false)
    }
}
