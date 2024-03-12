import Foundation

struct MessageResponse: Codable, Hashable {
	let _id: String
	let rid: String
	let msg: String
	let u: UserResponse
	let ts: Date
	let attachments: [AttachmentResponse]?
	let t: String?
	let groupable: Bool?
	let editedAt: Date?
	let role: String?
	let comment: String?
}
