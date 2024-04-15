import Foundation

struct SubscriptionsResponse: Codable {
	let update: Set<Subscription>
	let remove: Set<Subscription>
	let success: Bool
	
	struct Subscription: Codable, Hashable {
		let _id: String
		let rid: String
		let name: String?
		let fname: String?
		let t: String
		let unread: Int
		let alert: Bool
		let lr: Date?
		let open: Bool?
		let _updatedAt: Date?
		let hideUnreadStatus: Bool?
	}
}

extension Sequence where Element == SubscriptionsResponse.Subscription {
	func find(withRoomID rid: String) -> SubscriptionsResponse.Subscription? {
		first { subscription in
			subscription.rid == rid
		}
	}
}
