import Foundation

struct ClientSSL: Codable {
	let path: String
	let password: String
}

// Note: MMKV extension disabled during migration to react-native-mmkv
// The new library doesn't provide Swift API for Watch app usage
// This functionality needs to be reimplemented if Watch app support is needed
/*
extension MMKV {
	func clientSSL(for url: URL) -> ClientSSL? {
		let server = url.absoluteString.removeTrailingSlash()
		let host = url.host ?? ""
		
		guard let name = string(forKey: "RC_CERTIFICATE_KEY-\(server)") else {
			return nil
		}
		
		guard let data = data(forKey: host), let certificate = try? JSONDecoder().decode(ClientSSL.self, from: data) else {
			return nil
		}
		
		return .init(path: getFilePath(forName: name), password: certificate.password)
	}
	
	private func getFilePath(forName name: String) -> String {
		let paths = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)
		let documentsDirectory = paths[0]
		return documentsDirectory.path + "/" + name
	}
}
*/
