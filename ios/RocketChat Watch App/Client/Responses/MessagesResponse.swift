import Foundation

struct MessagesResponse: Codable {
	let result: MessagesResult
	let success: Bool
	
	struct MessagesResult: Codable {
		let updated: [MessageResponse]
		let deleted: [MessageResponse]
	}
}
