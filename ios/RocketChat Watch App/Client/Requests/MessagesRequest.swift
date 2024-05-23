import Foundation

struct MessagesRequest: Request {
	typealias Response = MessagesResponse
	
	let path: String = "api/v1/chat.syncMessages"
	let queryItems: [URLQueryItem]
	
	init(lastUpdate: Date?, roomId: String) {
		self.queryItems = [
			URLQueryItem(name: "roomId", value: roomId),
			URLQueryItem(name: "lastUpdate", value: lastUpdate?.ISO8601Format())
		]
	}
}
