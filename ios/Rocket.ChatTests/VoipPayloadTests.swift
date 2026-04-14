import XCTest
@testable import RocketChatRN

final class VoipPayloadTests: XCTestCase {

    private let validCallId = "11111111-2222-3333-4444-555555555555"
    private let validHost = "my-server.rocket.chat"
    private let validHostName = "my-server"
    private let validCallerName = "John Doe"
    private let validCallerUsername = "johndoe"
    private let validCallerAvatarUrl = "https://example.com/avatar.jpg"
    private let validType = "incoming_call"
    private let voipNotificationType = "voip"

    private static let iso8601Formatter: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime]
        formatter.timeZone = TimeZone(secondsFromGMT: 0)
        return formatter
    }()

    private func makeValidCreatedAt(secondsAgo: TimeInterval) -> String {
        let date = Date().addingTimeInterval(-secondsAgo)
        return VoipPayloadTests.iso8601Formatter.string(from: date)
    }

    private func makeValidPayload(
        callId: String? = nil,
        caller: [String: Any]? = nil,
        host: String? = nil,
        type: String? = nil,
        hostName: String? = nil,
        notificationType: String? = nil,
        createdAt: String? = nil
    ) -> [AnyHashable: Any] {
        return [
            "callId": callId ?? validCallId,
            "caller": caller ?? [
                "name": validCallerName,
                "username": validCallerUsername,
                "avatarUrl": validCallerAvatarUrl
            ],
            "host": host ?? validHost,
            "type": type ?? validType,
            "hostName": hostName ?? validHostName,
            "notificationType": notificationType ?? voipNotificationType,
            "createdAt": createdAt ?? makeValidCreatedAt(secondsAgo: 0)
        ]
    }

    func test_fromDictionary_happyPath() {
        let payload = makeValidPayload()
        let result = VoipPayload.fromDictionary(payload)
        XCTAssertNotNil(result)
        XCTAssertEqual(result?.callId, validCallId)
        XCTAssertEqual(result?.caller, validCallerName)
        XCTAssertEqual(result?.username, validCallerUsername)
        XCTAssertEqual(result?.host, validHost)
        XCTAssertEqual(result?.type, validType)
        XCTAssertEqual(result?.hostName, validHostName)
        XCTAssertEqual(result?.avatarUrl, validCallerAvatarUrl)
        XCTAssertNotNil(result?.createdAt)
    }

    func test_fromDictionary_missingCallId() {
        var payload = makeValidPayload()
        payload.removeValue(forKey: "callId")
        XCTAssertNil(VoipPayload.fromDictionary(payload))
    }

    func test_fromDictionary_missingCaller() {
        var payload = makeValidPayload()
        payload.removeValue(forKey: "caller")
        XCTAssertNil(VoipPayload.fromDictionary(payload))
    }

    func test_fromDictionary_missingHost() {
        var payload = makeValidPayload()
        payload.removeValue(forKey: "host")
        XCTAssertNil(VoipPayload.fromDictionary(payload))
    }

    func test_fromDictionary_missingType() {
        var payload = makeValidPayload()
        payload.removeValue(forKey: "type")
        XCTAssertNil(VoipPayload.fromDictionary(payload))
    }

    func test_fromDictionary_emptyStrings() {
        let payload = makeValidPayload(callId: "", host: "", type: "", hostName: "", createdAt: "")
        XCTAssertNil(VoipPayload.fromDictionary(payload))
    }

    func test_fromDictionary_invalidUUID() {
        let payload = makeValidPayload(callId: "not-a-valid-uuid")
        XCTAssertNil(VoipPayload.fromDictionary(payload))
    }

    func test_fromDictionary_wrongNotificationType() {
        let payload = makeValidPayload(notificationType: "regular_push")
        XCTAssertNil(VoipPayload.fromDictionary(payload))
    }

    func test_fromDictionary_withEjson() {
        let innerPayload = makeValidPayload()
        guard let innerData = try? JSONSerialization.data(withJSONObject: innerPayload as [AnyHashable: Any]),
              let innerString = String(data: innerData, encoding: .utf8) else {
            XCTFail("Failed to serialize inner payload")
            return
        }
        let payload: [AnyHashable: Any] = ["ejson": innerString]
        let result = VoipPayload.fromDictionary(payload)
        XCTAssertNotNil(result)
        XCTAssertEqual(result?.callId, validCallId)
        XCTAssertEqual(result?.caller, validCallerName)
        XCTAssertEqual(result?.username, validCallerUsername)
        XCTAssertEqual(result?.host, validHost)
        XCTAssertEqual(result?.type, validType)
    }

    func test_isVoipIncomingCall() {
        let payload = makeValidPayload(type: "incoming_call")
        guard let result = VoipPayload.fromDictionary(payload) else {
            XCTFail("Expected valid VoipPayload")
            return
        }
        XCTAssertTrue(result.isVoipIncomingCall())
    }

    func test_isVoipIncomingCall_invalid() {
        let wrongTypePayload = makeValidPayload(type: "call_ended")
        XCTAssertNil(VoipPayload.fromDictionary(wrongTypePayload))
        var missingCallId = makeValidPayload()
        missingCallId["callId"] = ""
        XCTAssertNil(VoipPayload.fromDictionary(missingCallId))
        var emptyCaller = makeValidPayload()
        emptyCaller["caller"] = ["name": "", "username": "johndoe", "avatarUrl": ""]
        XCTAssertNil(VoipPayload.fromDictionary(emptyCaller))
        var emptyHost = makeValidPayload()
        emptyHost["host"] = ""
        XCTAssertNil(VoipPayload.fromDictionary(emptyHost))
    }

    func test_remainingLifetime() {
        let payload = makeValidPayload(createdAt: makeValidCreatedAt(secondsAgo: 10))
        guard let result = VoipPayload.fromDictionary(payload) else {
            XCTFail("Expected valid VoipPayload")
            return
        }
        let lifetime = result.remainingLifetime()
        XCTAssertNotNil(lifetime)
        XCTAssertGreaterThan(lifetime!, 0)
        XCTAssertLessThan(lifetime!, VoipPayload.INCOMING_CALL_LIFETIME_SEC)
    }

    func test_isExpired() {
        let payload = makeValidPayload(createdAt: makeValidCreatedAt(secondsAgo: 120))
        guard let result = VoipPayload.fromDictionary(payload) else {
            XCTFail("Expected valid VoipPayload")
            return
        }
        XCTAssertTrue(result.isExpired())
    }

    func test_notificationId_deterministic() {
        let payload1 = makeValidPayload()
        guard let result1 = VoipPayload.fromDictionary(payload1) else {
            XCTFail("Expected valid VoipPayload")
            return
        }
        let payload2 = makeValidPayload()
        guard let result2 = VoipPayload.fromDictionary(payload2) else {
            XCTFail("Expected valid VoipPayload")
            return
        }
        XCTAssertEqual(result1.notificationId, result2.notificationId)
        let differentPayload = makeValidPayload(callId: "22222222-3333-4444-5555-666666666666")
        guard let differentResult = VoipPayload.fromDictionary(differentPayload) else {
            XCTFail("Expected valid VoipPayload")
            return
        }
        XCTAssertNotEqual(result1.notificationId, differentResult.notificationId)
    }
}
