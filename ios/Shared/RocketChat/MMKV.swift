import Foundation

extension MMKV {
	static func build() -> MMKV {
		let password = SecureStorage().getSecureKey("com.MMKV.default".toHex())
		let groupDir = FileManager.default.groupDir()
		
		MMKV.initialize(rootDir: nil, groupDir: groupDir, logLevel: MMKVLogLevel.info)
		
		guard let mmkv = MMKV(mmapID: "default", cryptKey: password?.data(using: .utf8), mode: MMKVMode.multiProcess) else {
			fatalError("Could not initialize MMKV instance.")
		}
		
		return mmkv
	}
	
	func userToken(for userId: String) -> String? {
		guard let userToken = string(forKey: "reactnativemeteor_usertoken-\(userId)") else {
			return nil
		}
		
		return userToken
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
