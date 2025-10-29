import Foundation

extension MMKVBridge {
	static func build() -> MMKVBridge {
		let password = SecureStorage().getSecureKey("com.MMKV.default".toHex())
		let groupDir = FileManager.default.groupDir()
		
		// Use the same path as TypeScript: appGroupPath/mmkv for backward compatibility
		var mmkvPath: String?
		if !groupDir.isEmpty {
			mmkvPath = "\(groupDir)/mmkv"
			// Ensure the directory exists
			if let path = mmkvPath {
				try? FileManager.default.createDirectory(atPath: path, withIntermediateDirectories: true, attributes: nil)
			}
		}
		
		let cryptKey = password?.data(using: .utf8)
		return MMKVBridge(id: "default", cryptKey: cryptKey, rootPath: mmkvPath)
	}
	
	func userToken(for userId: String) -> String? {
		return string(forKey: "reactnativemeteor_usertoken-\(userId)")
	}
	
	func userId(for server: String) -> String? {
		return string(forKey: "reactnativemeteor_usertoken-\(server)")
	}
	
	func privateKey(for server: String) -> String? {
		return string(forKey: "\(server)-RC_E2E_PRIVATE_KEY")
	}
}
