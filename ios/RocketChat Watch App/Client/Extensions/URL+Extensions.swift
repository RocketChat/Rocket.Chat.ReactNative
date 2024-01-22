import Foundation

extension URL {
	func appending(queryItems: [URLQueryItem]) -> Self {
		var components = URLComponents(url: self, resolvingAgainstBaseURL: true)
		
		components?.queryItems = queryItems
		
		return components?.url ?? self
	}
	
	func appending(path: String) -> Self {
		appendingPathComponent(path)
	}
}
