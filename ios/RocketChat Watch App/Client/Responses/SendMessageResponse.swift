import Foundation

struct SendMessageResponse: Codable {
	let message: MessageResponse
	let success: Bool
}
