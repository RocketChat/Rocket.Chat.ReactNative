import Foundation

struct RoomsResponse: Codable {
	let update: Set<Room>
	let remove: Set<Room>
	let success: Bool
	
	struct Room: Codable, Hashable {
		let _id: String
		let name: String?
		let fname: String?
		let prid: String?
		let t: String?
		let ts: Date?
		let ro: Bool?
		let _updatedAt: Date?
		let encrypted: Bool?
		let usernames: [String]?
		let uids: [String]?
		let lastMessage: FailableDecodable<MessageResponse>?
		let lm: Date?
		let teamMain: Bool?
		let archived: Bool?
		let broadcast: Bool?
	}
}
