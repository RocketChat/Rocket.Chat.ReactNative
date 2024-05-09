import Foundation

struct HistoryResponse: Codable {
	let messages: [MessageResponse]
	let success: Bool
}
