import Foundation

struct AttachmentResponse: Codable, Hashable {
	let title: String?
	let imageURL: URL?
	let audioURL: URL?
	let description: String?
	let dimensions: Dimensions?
	
	enum CodingKeys: String, CodingKey {
		case imageURL = "image_url"
		case audioURL = "audio_url"
		case title
		case description
		case dimensions = "image_dimensions"
	}
	
	struct Dimensions: Codable, Hashable {
		let width: Double
		let height: Double
	}
}
