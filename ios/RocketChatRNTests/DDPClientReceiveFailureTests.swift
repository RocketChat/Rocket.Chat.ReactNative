import XCTest
@testable import RocketChatRN

/// Covers WebSocket `receive` failures for `DDPClient` (not run in CI until this file is added to an iOS unit-test target in Xcode).
///
/// Manual SSL pinning: use Charles with a non-pinned cert on the WebSocket host; the handshake must fail (same `Challenge` path as the rest of the app).
final class DDPClientReceiveFailureTests: XCTestCase {
	func testReceiveFailureClearsConnectionAndSession() {
		let client = DDPClient()
		let session = URLSession(configuration: .ephemeral)
		let task = session.webSocketTask(with: URL(string: "wss://example.invalid")!)

		client.testing_installWebSocketSync(urlSession: session, task: task)

		let error = NSError(domain: NSURLErrorDomain, code: NSURLErrorNetworkConnectionLost, userInfo: nil)
		client.testing_applyReceiveResult(.failure(error), for: task)

		let expectation = expectation(description: "connection state after receive failure")
		client.testing_readConnectionState { isConnected, webSocketTaskIsNil, urlSessionIsNil in
			XCTAssertFalse(isConnected, "Client should not stay connected after a receive failure")
			XCTAssertTrue(webSocketTaskIsNil, "WebSocket task should be cleared after disconnect")
			XCTAssertTrue(urlSessionIsNil, "URLSession should be invalidated after disconnect")
			expectation.fulfill()
		}

		waitForExpectations(timeout: 2.0)
	}
}
