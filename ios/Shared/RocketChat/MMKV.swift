import Foundation

extension MMKVBridge {
	static func build() -> MMKVBridge {
		let password = SecureStorage().getSecureKey("com.MMKV.default".toHex())
		let groupDir = FileManager.default.groupDir()
		
		let cryptKey = password?.data(using: .utf8)
		return MMKVBridge(id: "default", cryptKey: cryptKey, rootPath: groupDir)
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
