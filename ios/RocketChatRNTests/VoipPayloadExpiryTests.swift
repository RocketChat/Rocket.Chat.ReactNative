import XCTest
@testable import RocketChatRN

final class VoipPayloadExpiryTests: XCTestCase {

    private let incomingCallLifetime: TimeInterval = 60

    private func makePayload(createdAt: String?) -> VoipPayload {
        return VoipPayload(
            callId: "00000000-0000-0000-0000-000000000001",
            callUUID: UUID(uuidString: "00000000-0000-0000-0000-000000000001")!,
            caller: "Caller",
            username: "user1",
            host: "https://example.com",
            type: "incoming_call",
            hostName: "Example",
            avatarUrl: nil,
            createdAt: createdAt,
            voipAcceptFailed: false
        )
    }

    private func iso8601(_ date: Date) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        formatter.timeZone = TimeZone(secondsFromGMT: 0)
        return formatter.string(from: date)
    }

    func testRemainingLifetimeReturnsFullLifetimeWhenDeviceClockFarAhead() {
        let createdAt = Date(timeIntervalSince1970: 1_700_000_000)
        let payload = makePayload(createdAt: iso8601(createdAt))
        // Device clock 20 min ahead -> skew exceeds 10 min threshold
        let now = createdAt.addingTimeInterval(20 * 60)
        XCTAssertEqual(payload.remainingLifetime(now: now), incomingCallLifetime)
    }

    func testRemainingLifetimeReturnsFullLifetimeWhenDeviceClockFarBehind() {
        let createdAt = Date(timeIntervalSince1970: 1_700_000_000)
        let payload = makePayload(createdAt: iso8601(createdAt))
        // Device clock 20 min behind -> skew exceeds 10 min threshold
        let now = createdAt.addingTimeInterval(-20 * 60)
        XCTAssertEqual(payload.remainingLifetime(now: now), incomingCallLifetime)
    }

    func testRemainingLifetimeReturnsExpectedWhenSkewSmallAndCallFresh() {
        let createdAt = Date(timeIntervalSince1970: 1_700_000_000)
        let payload = makePayload(createdAt: iso8601(createdAt))
        // 30s after createdAt -> ~30s remaining
        let now = createdAt.addingTimeInterval(30)
        XCTAssertEqual(payload.remainingLifetime(now: now) ?? -1, 30, accuracy: 0.5)
    }

    func testRemainingLifetimeReturnsZeroWhenSkewSmallAndCallStale() {
        let createdAt = Date(timeIntervalSince1970: 1_700_000_000)
        let payload = makePayload(createdAt: iso8601(createdAt))
        // 70s after createdAt -> expired
        let now = createdAt.addingTimeInterval(70)
        XCTAssertEqual(payload.remainingLifetime(now: now), 0)
    }

    func testRemainingLifetimeReturnsNilWhenCreatedAtIsNil() {
        let payload = makePayload(createdAt: nil)
        XCTAssertNil(payload.remainingLifetime(now: Date()))
    }

    func testRemainingLifetimeReturnsNilWhenCreatedAtIsEmpty() {
        let payload = makePayload(createdAt: "")
        XCTAssertNil(payload.remainingLifetime(now: Date()))
    }

    func testRemainingLifetimeReturnsNilWhenCreatedAtIsMalformed() {
        let payload = makePayload(createdAt: "not-a-date")
        XCTAssertNil(payload.remainingLifetime(now: Date()))
    }

    func testIsExpiredFollowsRemainingLifetimeAcrossSkewScenarios() {
        let createdAt = Date(timeIntervalSince1970: 1_700_000_000)
        let payload = makePayload(createdAt: iso8601(createdAt))

        // Far-ahead skew: device clock untrusted -> not expired
        XCTAssertFalse(payload.isExpired(now: createdAt.addingTimeInterval(20 * 60)))
        // Far-behind skew: device clock untrusted -> not expired
        XCTAssertFalse(payload.isExpired(now: createdAt.addingTimeInterval(-20 * 60)))
        // Fresh call within trusted skew -> not expired
        XCTAssertFalse(payload.isExpired(now: createdAt.addingTimeInterval(30)))
        // Stale call within trusted skew -> expired
        XCTAssertTrue(payload.isExpired(now: createdAt.addingTimeInterval(70)))

        // Missing createdAt -> expired (remaining lifetime is nil)
        let nilPayload = makePayload(createdAt: nil)
        XCTAssertTrue(nilPayload.isExpired(now: Date()))
    }
}
