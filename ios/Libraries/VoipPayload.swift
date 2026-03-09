import Foundation

private struct RemoteCaller {
    let name: String?
    let avatarUrl: String?

    static func fromDictionary(_ payload: [AnyHashable: Any]) -> RemoteCaller {
        RemoteCaller(
            name: payload["name"] as? String,
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

    static func fromDictionary(_ payload: [AnyHashable: Any]) -> RemoteVoipPayload {
        let caller = (payload["caller"] as? [AnyHashable: Any]).map(RemoteCaller.fromDictionary)

        return RemoteVoipPayload(
            callId: payload["callId"] as? String,
            caller: caller,
            username: payload["username"] as? String,
            host: payload["host"] as? String,
            type: payload["type"] as? String,
            hostName: payload["hostName"] as? String,
            notificationType: payload["notificationType"] as? String
        )
    }

    func toVoipPayload() -> VoipPayload? {
        guard notificationType == "voip" else {
            return nil
        }

        guard
            let payloadCallId = callId,
            let payloadCaller = caller?.name,
            let payloadUsername = username,
            let payloadHost = host,
            let payloadType = type,
            payloadType == "incoming_call",
            let payloadHostName = hostName
        else {
            return nil
        }

        return VoipPayload(
            callId: payloadCallId,
            caller: payloadCaller,
            username: payloadUsername,
            host: payloadHost,
            type: payloadType,
            hostName: payloadHostName,
            avatarUrl: caller?.avatarUrl
        )
    }
}

/// Data structure for initial events payload
@objc(VoipPayload)
public class VoipPayload: NSObject {
    @objc public let callId: String
    @objc public let caller: String
    @objc public let username: String
    @objc public let host: String
    @objc public let type: String
    @objc public let hostName: String
    @objc public let avatarUrl: String?

    @objc public var notificationId: Int {
        return callId.hashValue
    }

    @objc
    public init(callId: String, caller: String, username: String, host: String, type: String, hostName: String, avatarUrl: String?) {
        self.callId = callId
        self.caller = caller
        self.username = username
        self.host = host
        self.type = type
        self.hostName = hostName
        self.avatarUrl = avatarUrl
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
            "notificationId": notificationId
        ]
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
}
