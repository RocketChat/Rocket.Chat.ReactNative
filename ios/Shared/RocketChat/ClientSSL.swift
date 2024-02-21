import Foundation

struct ClientSSL: Codable {
	let path: String
	let password: String
}

extension MMKV {
	func clientSSL(for url: URL) -> ClientSSL? {
		guard let host = url.host?.removeTrailingSlash() else {
			return nil
		}
		
		guard let rawClientSSL = string(forKey: host) else {
			return nil
		}
		
		guard let data = rawClientSSL.data(using: .utf8) else {
			return nil
		}
		
		guard let clientSSL = try? JSONDecoder().decode(ClientSSL.self, from: data) else {
			return nil
		}
		
		return clientSSL
	}
}
