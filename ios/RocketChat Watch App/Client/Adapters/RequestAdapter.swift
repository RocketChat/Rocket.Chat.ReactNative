import Foundation

protocol RequestAdapter {
	func adapt(_ urlRequest: URLRequest) -> URLRequest
	func adapt(_ url: URL) -> URL
}

extension RequestAdapter {
	func adapt(_ url: URL) -> URL {
		url
	}
}
