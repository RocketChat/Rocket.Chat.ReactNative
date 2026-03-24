import Foundation

struct Credentials {
    let userId: String
    let userToken: String
}

final class Storage {
    private let mmkv = MMKVBridge.build()
    
    func getCredentials(server: String) -> Credentials? {
        // Read credentials from MMKV (shared via app group)
        // Credentials are stored during login in React Native
        guard let userId = mmkv.userId(for: server),
              let userToken = mmkv.userToken(for: userId) else {
            return nil
        }
        return Credentials(userId: userId, userToken: userToken)
    }
    
    func getPrivateKey(server: String) -> String? {
        mmkv.privateKey(for: server)
    }
}
