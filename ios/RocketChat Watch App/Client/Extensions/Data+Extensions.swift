import Foundation

extension Data {
	func decode<T: Decodable>(_ type: T.Type) throws -> T {
		let decoder = JSONDecoder()
		decoder.dateDecodingStrategy = .iso8601withFractionalSeconds
		return try decoder.decode(T.self, from: self)
	}
}
