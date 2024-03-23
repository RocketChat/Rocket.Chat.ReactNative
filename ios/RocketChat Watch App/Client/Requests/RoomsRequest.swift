import Foundation

struct RoomsRequest: Request {
	typealias Response = RoomsResponse
	
	let path: String = "api/v1/rooms.get"
	let queryItems: [URLQueryItem]
	
	init(updatedSince: Date?) {
		if let updatedSince {
			queryItems = [URLQueryItem(name: "updatedSince", value: updatedSince.iso8601withFractionalSeconds)]
		} else {
			queryItems = []
		}
	}
}
