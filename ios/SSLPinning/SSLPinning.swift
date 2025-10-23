@objc(SSLPinning)
final class SSLPinning: NSObject {
	private struct Constants {
		static let certificateKey = "ssl_pinning_certificate"
		static let passwordKey = "ssl_pinning_password"
	}
	
	private let database = Database(name: "default")
	// Note: MMKV disabled during migration to react-native-mmkv (no Swift API available)
	// private let mmkv = MMKV.build()
	
	@objc func setCertificate(_ server: String, _ path: String, _ password: String) {
		guard FileManager.default.fileExists(atPath: path) else {
			return
		}
		
		guard let certificate = NSData(contentsOfFile: path) else {
			return
		}
		
		// Note: MMKV disabled - certificates now managed via JS layer
		// mmkv.set(Data(referencing: certificate), forKey: Constants.certificateKey.appending(server))
		// mmkv.set(password, forKey: Constants.passwordKey.appending(server))
	}
	
    @objc func migrate() {
        // Note: Migration disabled - MMKV no longer available in Swift
        // This functionality needs to be handled via React Native layer
        /*
        guard let serversQuery = database.query("SELECT * FROM servers") else {
            print("No servers found")
            return
        }

        serversQuery.forEach { server in
            guard let serverUrlString = server["id"] as? String,
                  let serverUrl = URL(string: serverUrlString),
                  let clientSSL = mmkv.clientSSL(for: serverUrl) else {
                return
            }

            setCertificate(
                serverUrl.absoluteString.removeTrailingSlash(),
                clientSSL.path,
                clientSSL.password
            )
        }
        */
    }
	
	func getCertificate(server: String) -> (certificate: Data, password: String)? {
		// Note: MMKV disabled - certificates now managed via JS layer
		// This is only used by Watch app which needs to be updated
		return nil
		/*
		guard let certificate = mmkv.data(forKey: Constants.certificateKey.appending(server)) else {
			return nil
		}
		
		guard let password = mmkv.string(forKey: Constants.passwordKey.appending(server)) else {
			return nil
		}
		
		return (certificate, password)
		*/
	}
}
