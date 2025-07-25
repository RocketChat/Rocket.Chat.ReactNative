import Foundation

struct ErrorResponse: Codable, Identifiable {
	var id: String {
		error
	}
	
	let error: String
}

enum RocketChatError: Error {
	case server(response: ErrorResponse)
	case unauthorized
	case unknown
}
