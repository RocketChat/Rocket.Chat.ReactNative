struct FailableDecodable<Value: Codable & Hashable>: Codable, Hashable {
	let value: Value?
	
	init(from decoder: Decoder) throws {
		let container = try decoder.singleValueContainer()
		value = try? container.decode(Value.self)
	}
	
	func encode(to encoder: Encoder) throws {
		var container = encoder.singleValueContainer()
		try container.encode(value)
	}
}
