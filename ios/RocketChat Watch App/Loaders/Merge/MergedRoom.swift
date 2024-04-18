import Foundation

struct MergedRoom {
	let id: String
	let name: String?
	let fname: String?
	let t: String
	let unread: Int
	let alert: Bool
	let lr: Date?
	let open: Bool?
	let rid: String
	let hideUnreadStatus: Bool?
	
	let archived: Bool?
	let broadcast: Bool?
	let encrypted: Bool?
	let isReadOnly: Bool?
	let prid: String?
	let teamMain: Bool?
	let ts: Date?
	let uids: [String]?
	let updatedAt: Date?
	let usernames: [String]?
	let lastMessage: Message?
	let lm: Date?
	
	struct Message {
		let _id: String
		let rid: String
		let msg: String
		let u: User
		let ts: Date
		let attachments: [Attachment]?
		let t: String?
		let groupable: Bool?
		let editedAt: Date?
		let role: String?
		let comment: String?
		
		struct User {
			let _id: String
			let username: String?
			let name: String?
		}
		
		struct Attachment {
			let title: String?
			let imageURL: URL?
			let audioURL: URL?
			let description: String?
			let dimensions: Dimensions?
			
			struct Dimensions {
				let width: Double
				let height: Double
			}
		}
	}
}
