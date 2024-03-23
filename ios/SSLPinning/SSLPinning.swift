import WatermelonDB

@objc(SSLPinning)
final class SSLPinning: NSObject {
	private struct Constants {
		static let certificateKey = "ssl_pinning_certificate"
		static let passwordKey = "ssl_pinning_password"
	}
	
	private let database = WatermelonDB.Database(name: "default")
	private let mmkv = MMKV.build()
	
	@objc func setCertificate(_ server: String, _ path: String, _ password: String) {
		guard FileManager.default.fileExists(atPath: path) else {
			return
		}
		
		guard let certificate = NSData(contentsOfFile: path) else {
			return
		}
		
		mmkv.set(Data(referencing: certificate), forKey: Constants.certificateKey.appending(server))
		mmkv.set(password, forKey: Constants.passwordKey.appending(server))
	}
	
	@objc func migrate() {
		let serversQuery = database.query(raw: "select * from servers") as [DBServer]
		
		serversQuery.forEach { server in
			guard let clientSSL = mmkv.clientSSL(for: server.url) else {
				return
			}
			
			setCertificate(
				server.url.absoluteString.removeTrailingSlash(),
				clientSSL.path,
				clientSSL.password
			)
		}
	}
	
	func getCertificate(server: String) -> (certificate: Data, password: String)? {
		guard let certificate = mmkv.data(forKey: Constants.certificateKey.appending(server)) else {
			return nil
		}
		
		guard let password = mmkv.string(forKey: Constants.passwordKey.appending(server)) else {
			return nil
		}
		
		return (certificate, password)
	}
}
