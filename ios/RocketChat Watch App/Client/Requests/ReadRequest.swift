import Foundation

struct ReadRequest: Request {
	typealias Response = ReadResponse
	
	let path: String = "api/v1/subscriptions.read"
	let method: HTTPMethod = .post
	
	var body: Data? {
		try? JSONSerialization.data(withJSONObject: [
			"rid": rid
		])
	}
	
	let rid: String
	
	init(rid: String) {
		self.rid = rid
	}
}
