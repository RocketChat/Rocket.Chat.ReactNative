import Foundation

protocol Request<Response> {
	associatedtype Response: Codable
	
	var path: String { get }
	var method: HTTPMethod { get }
	var body: Data? { get }
	var queryItems: [URLQueryItem] { get }
}

extension Request {
	var method: HTTPMethod {
		.get
	}
	
	var body: Data? {
		nil
	}
	
	var queryItems: [URLQueryItem] {
		[]
	}
}
