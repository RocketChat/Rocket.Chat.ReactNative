import Foundation

struct JSONAdapter: RequestAdapter {
	func adapt(_ urlRequest: URLRequest) -> URLRequest {
		var request = urlRequest
		request.addValue("application/json", forHTTPHeaderField: "Content-Type")
		request.addValue("application/json", forHTTPHeaderField: "Accept")
		return request
	}
}
