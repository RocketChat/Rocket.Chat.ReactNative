import Foundation
import Security
import os

struct Credentials {
	let userId: String
	let userToken: String
}

final class Storage {
//	private let mmkv = MMKV.build()
	
    // func getCredentials(server: String) -> Credentials? {
	// 	guard let userId = mmkv.userId(for: server), let userToken = mmkv.userToken(for: userId) else {
    //         mmkv.close()
	// 		return nil
	// 	}
        
    //     os_log("USERID: %@", log: logger, type: .info, userId)
    //     os_log("USERTOKEN: %@", log: logger, type: .info, userToken)
        
    //     mmkv.close()
		
	// 	return .init(userId: userId, userToken: userToken)
	// }
    func getInternetCredentials(server: String, accessGroup: String) -> (account: String?, token: String?)? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassInternetPassword,
            kSecAttrServer as String: server,
            kSecAttrAccessGroup as String: accessGroup,
            kSecMatchLimit as String: kSecMatchLimitOne,
            kSecReturnAttributes as String: true,
            kSecReturnData as String: true
        ]
        
        var item: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &item)
        
        guard status == errSecSuccess else {
            print("Error retrieving credentials: \(status)")
            return nil
        }
        
        guard let existingItem = item as? [String: Any],
              let account = existingItem[kSecAttrAccount as String] as? String,
              let passwordData = existingItem[kSecValueData as String] as? Data,
              let password = String(data: passwordData, encoding: .utf8) else {
            return nil
        }
        
        return (account, password)
    }
    
    func getCredentials(server: String) -> Credentials? {
        if let credentials = getInternetCredentials(server: server, accessGroup: "group.ios.chat.rocket") {
            guard let userId = credentials.account else { return nil }
            guard let token = credentials.token else { return nil }
            
            os_log("userId: %@, token: %@", log: logger, type: .info, userId, token)
            return .init(userId: userId, userToken: token)
        } else {
            print("No credentials found.")
            return nil
        }
    }
	
	func getPrivateKey(server: String) -> String? {
//		mmkv.privateKey(for: server)
        return "ABC"
	}
}
