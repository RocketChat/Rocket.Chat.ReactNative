import Foundation

extension MMKVBridge {
	static func build() -> MMKVBridge {
		let password = SecureStorage().getSecureKey("com.MMKV.default".toHex())
		let groupDir = FileManager.default.groupDir()
		
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
	
	// Keep in sync with getUserTokenKey() (JS) and Ejson.token() (Android); falls back to the
	// legacy userId-only slot until the JS migration runs.
	func userToken(for userId: String, server: String) -> String? {
		if let userToken = string(forKey: "reactnativemeteor_usertoken-\(server)-\(userId)") {
			return userToken
		}
		// The legacy slot is ambiguous across servers sharing a userId, so it is only readable
		// before migrateTokenKeysToServerScoped (JS) runs.
		if bool(forKey: "RC_TOKEN_KEY_SERVER_SCOPED_MIGRATED") {
			return nil
		}
		return string(forKey: "reactnativemeteor_usertoken-\(userId)")
	}
	
	func userId(for server: String) -> String? {
		guard let userId = string(forKey: "reactnativemeteor_usertoken-\(server)") else {
			return nil
		}
		return userId
	}
	
	func privateKey(for server: String) -> String? {
		guard let privateKey = string(forKey: "\(server)-RC_E2E_PRIVATE_KEY") else {
			return nil
		}
		return privateKey
	}
}
