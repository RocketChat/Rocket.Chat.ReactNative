import Foundation

struct AttachmentResponse: Codable, Hashable {
    let imageURL: URL?
    let description: String?
    let dimensions: Dimensions?
    
    enum CodingKeys: String, CodingKey {
        case imageURL = "image_url"
        case description
        case dimensions = "image_dimensions"
    }
    
    struct Dimensions: Codable, Hashable {
        let width: Double
        let height: Double
    }
}
