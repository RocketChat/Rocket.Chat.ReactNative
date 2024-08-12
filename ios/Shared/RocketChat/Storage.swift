import Foundation
import Security

struct Credentials {
	let userId: String
	let userToken: String
}

final class Storage {
	private let mmkv = MMKV.build()
    
    func getCredentials(server: String) -> Credentials? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassInternetPassword,
            kSecAttrServer as String: server,
            kSecAttrAccessGroup as String: "group.ios.chat.rocket",
            kSecMatchLimit as String: kSecMatchLimitOne,
            kSecReturnAttributes as String: true,
            kSecReturnData as String: true
        ]
        
        var item: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &item)
        
        guard status == errSecSuccess else {
            return nil
        }
        
        guard let existingItem = item as? [String: Any],
              let account = existingItem[kSecAttrAccount as String] as? String,
              let passwordData = existingItem[kSecValueData as String] as? Data,
              let password = String(data: passwordData, encoding: .utf8) else {
            return nil
        }
        
        return .init(userId: account, userToken: password)
    }
	
	func getPrivateKey(server: String) -> String? {
		mmkv.privateKey(for: server)
	}
}
