import Foundation

struct SendMessageRequest: Request {
	typealias Response = SendMessageResponse
	
	let path: String = "api/v1/chat.sendMessage"
	let method: HTTPMethod = .post
	
	var body: Data? {
		try? JSONSerialization.data(withJSONObject: [
			"message": [
				"_id": id,
				"rid": rid,
				"msg": msg,
				"tshow": false
			]
		])
	}
	
	let id: String
	let rid: String
	let msg: String
	
	init(id: String, rid: String, msg: String) {
		self.id = id
		self.rid = rid
		self.msg = msg
	}
}
