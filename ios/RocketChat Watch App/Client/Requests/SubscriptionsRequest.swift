import Foundation

struct SubscriptionsRequest: Request {
	typealias Response = SubscriptionsResponse
	
	let path: String = "api/v1/subscriptions.get"
	let queryItems: [URLQueryItem]
	
	init(updatedSince: Date?) {
		if let updatedSince {
			queryItems = [URLQueryItem(name: "updatedSince", value: updatedSince.iso8601withFractionalSeconds)]
		} else {
			queryItems = []
		}
	}
}
