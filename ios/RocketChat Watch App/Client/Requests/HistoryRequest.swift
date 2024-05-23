import Foundation

let HISTORY_MESSAGE_COUNT = 50

struct HistoryRequest: Request {
	typealias Response = HistoryResponse
	
	let path: String
	let queryItems: [URLQueryItem]
	
	init(roomId: String, roomType: String?, latest: Date) {
		path = "api/v1/\(RoomType.from(roomType).api).history"
		
		queryItems = [
			URLQueryItem(name: "roomId", value: roomId),
			URLQueryItem(name: "count", value: String(HISTORY_MESSAGE_COUNT)),
			URLQueryItem(name: "latest", value: latest.iso8601withFractionalSeconds)
		]
	}
}

fileprivate enum RoomType: String {
	case direct = "d"
	case group = "p"
	case channel = "c"
	case livechat = "l"
	
	static func from(_ rawValue: String?) -> Self {
		guard let rawValue, let type = RoomType(rawValue: rawValue) else {
			return .channel
		}
		
		return type
	}
	
	var api: String {
		switch self {
			case .direct:
				return "im"
			case .group:
				return "groups"
			case .channel, .livechat:
				return "channels"
		}
	}
}
