import Foundation

private struct RemoteCaller {
    let name: String?
    let username: String?
    let avatarUrl: String?

    static func fromDictionary(_ payload: [AnyHashable: Any]) -> RemoteCaller {
        RemoteCaller(
            name: payload["name"] as? String,
            username: payload["username"] as? String,
            avatarUrl: payload["avatarUrl"] as? String
        )
    }
}

private struct RemoteVoipPayload {
    let callId: String?
    let caller: RemoteCaller?
    let username: String?
    let host: String?
    let type: String?
    let hostName: String?
    let notificationType: String?
    let createdAt: String?

    static func fromDictionary(_ payload: [AnyHashable: Any]) -> RemoteVoipPayload {
        let caller = (payload["caller"] as? [AnyHashable: Any]).map(RemoteCaller.fromDictionary)

        return RemoteVoipPayload(
            callId: payload["callId"] as? String,
            caller: caller,
            username: payload["username"] as? String,
            host: payload["host"] as? String,
            type: payload["type"] as? String,
            hostName: payload["hostName"] as? String,
            notificationType: payload["notificationType"] as? String,
            createdAt: payload["createdAt"] as? String
        )
    }

    func toVoipPayload() -> VoipPayload? {
        guard notificationType == "voip" else {
            return nil
        }

        guard
            let payloadCallId = callId,
            let payloadCallUUID = UUID(uuidString: payloadCallId),
            let payloadCaller = caller?.name,
            let payloadUsername = caller?.username ?? username,
            let payloadHost = host,
            let payloadType = type,
            let payloadHostName = hostName,
            let payloadCreatedAt = createdAt,
            !payloadCreatedAt.isEmpty
        else {
            return nil
        }

        return VoipPayload(
            callId: payloadCallId,
            callUUID: payloadCallUUID,
            caller: payloadCaller,
            username: payloadUsername,
            host: payloadHost,
            type: payloadType,
            hostName: payloadHostName,
            avatarUrl: caller?.avatarUrl,
            createdAt: payloadCreatedAt
        )
    }
}

/// Data structure for initial events payload
@objc(VoipPayload)
public class VoipPayload: NSObject {
    // the amount of time in seconds that an incoming call will be kept alive
    @objc public static let INCOMING_CALL_LIFETIME_SEC: TimeInterval = 60

    @objc public let callId: String
    let callUUID: UUID
    @objc public let caller: String
    @objc public let username: String
    @objc public let host: String
    @objc public let type: String
    @objc public let hostName: String
    @objc public let avatarUrl: String?
    @objc public let createdAt: String?

    private var createdAtDate: Date? {
        return Self.parseCreatedAt(createdAt)
    }

    private var expiresAt: Date? {
        return createdAtDate?.addingTimeInterval(Self.INCOMING_CALL_LIFETIME_SEC)
    }

    private static let iso8601FormatterWithFractionalSeconds: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        formatter.timeZone = TimeZone(secondsFromGMT: 0)
        return formatter
    }()

    private static let iso8601Formatter: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime]
        formatter.timeZone = TimeZone(secondsFromGMT: 0)
        return formatter
    }()

    @objc public var notificationId: Int {
        return Self.stableNotificationId(for: callId)
    }

    /// Deterministic hash for consistent notification IDs across app launches.
    /// Matches Java/Kotlin String.hashCode() semantics over UTF-16 code units.
    private static func stableNotificationId(for value: String) -> Int {
        var hash: Int32 = 0
        for codeUnit in value.utf16 {
            hash = (31 &* hash) &+ Int32(codeUnit)
        }
        return Int(hash)
    }

    init(callId: String, callUUID: UUID, caller: String, username: String, host: String, type: String, hostName: String, avatarUrl: String?, createdAt: String?) {
        self.callId = callId
        self.callUUID = callUUID
        self.caller = caller
        self.username = username
        self.host = host
        self.type = type
        self.hostName = hostName
        self.avatarUrl = avatarUrl
        self.createdAt = createdAt
        super.init()
    }

    @objc
    public func isVoipIncomingCall() -> Bool {
        return type == "incoming_call" && !callId.isEmpty && !caller.isEmpty && !host.isEmpty
    }

    @objc
    public func toDictionary() -> [String: Any] {
        return [
            "callId": callId,
            "caller": caller,
            "username": username,
            "host": host,
            "type": type,
            "hostName": hostName,
            "avatarUrl": avatarUrl ?? NSNull(),
            "createdAt": createdAt ?? NSNull(),
            "notificationId": notificationId
        ]
    }

    public func remainingLifetime(now: Date = Date()) -> TimeInterval? {
        guard let expiresAt else {
            return nil
        }

        return max(0, expiresAt.timeIntervalSince(now))
    }

    public func isExpired(now: Date = Date()) -> Bool {
        guard let remainingLifetime = remainingLifetime(now: now) else {
            return true
        }

        return remainingLifetime <= 0
    }

    @objc
    public static func fromDictionary(_ dict: [AnyHashable: Any]) -> VoipPayload? {
        if let parsedPayload = parseRemotePayload(from: dict).toVoipPayload() {
            return parsedPayload
        }

        guard
            let ejsonString = dict["ejson"] as? String,
            !ejsonString.isEmpty,
            ejsonString != "{}",
            let data = ejsonString.data(using: .utf8),
            let ejsonPayload = (try? JSONSerialization.jsonObject(with: data)) as? [AnyHashable: Any]
        else {
            return nil
        }

        return parseRemotePayload(from: ejsonPayload).toVoipPayload()
    }

    private static func parseRemotePayload(from payload: [AnyHashable: Any]) -> RemoteVoipPayload {
        return RemoteVoipPayload.fromDictionary(payload)
    }

    private static func parseCreatedAt(_ value: String?) -> Date? {
        guard let value, !value.isEmpty else {
            return nil
        }

        if let parsed = iso8601FormatterWithFractionalSeconds.date(from: value) {
            return parsed
        }

        return iso8601Formatter.date(from: value)
    }
}
