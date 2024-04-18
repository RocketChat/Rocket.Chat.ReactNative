import Foundation
import WatermelonDB
import WatchConnectivity

@objc
final class WatchConnection: NSObject {
	private let database = WatermelonDB.Database(name: "default")
	private let mmkv = MMKV.build()
	private let session: WCSession
	
	@objc init(session: WCSession) {
		self.session = session
		super.init()
		
		if WCSession.isSupported() {
			session.delegate = self
			session.activate()
		}
	}
	
	private func getMessage() -> WatchMessage {
		let serversQuery = database.query(raw: "select * from servers") as [DBServer]
		
		let servers = serversQuery.compactMap { item -> WatchMessage.Server? in
			guard let userId = mmkv.userId(for: item.identifier), let userToken = mmkv.userToken(for: userId) else {
				return nil
			}
			
			let clientSSL = SSLPinning().getCertificate(server: item.url.absoluteString.removeTrailingSlash())
			
			let usersQuery = database.query(raw: "select * from users where token == ? limit 1", [userToken]) as [DBUser]
			
			guard let user = usersQuery.first else {
				return nil
			}
			
			return WatchMessage.Server(
				url: item.url,
				name: item.name,
				iconURL: item.iconURL,
				useRealName: item.useRealName == 1 ? true : false,
				loggedUser: .init(
					id: userId,
					token: userToken,
					name: user.name,
					username: user.username
				),
				clientSSL: clientSSL.map {
					.init(
						certificate: $0.certificate,
						password: $0.password
					)
				},
				version: item.version
			)
		}
		
		return WatchMessage(servers: servers)
	}
	
	private func encodedMessage() -> [String: Any] {
		do {
			let data = try JSONEncoder().encode(getMessage())
			
			guard let dictionary = try JSONSerialization.jsonObject(with: data, options: .allowFragments) as? [String: Any] else {
				fatalError("Could not serialize message: \(getMessage())")
			}
			
			return dictionary
		} catch {
			fatalError("Could not encode message: \(getMessage())")
		}
	}
}

extension WatchConnection: WCSessionDelegate {
	func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
		
	}
	
	func sessionDidBecomeInactive(_ session: WCSession) {
		session.activate()
	}
	
	func sessionDidDeactivate(_ session: WCSession) {
		session.activate()
	}
	
	func session(_ session: WCSession, didReceiveMessage message: [String : Any], replyHandler: @escaping ([String : Any]) -> Void) {
		replyHandler(encodedMessage())
	}
}
