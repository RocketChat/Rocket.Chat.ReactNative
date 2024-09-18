import Foundation
import WatchConnectivity

@objc
final class WatchConnection: NSObject {
	private let database = Database(name: "default")
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
	
    private func getMessage() -> WatchMessage? {
        guard let serversQuery = database.query("SELECT * FROM servers") else {
            print("No servers found")
            return nil
        }

        let servers = serversQuery.compactMap { item -> WatchMessage.Server? in
            guard let userId = mmkv.userId(for: item["identifier"] as? String ?? ""),
                  let userToken = mmkv.userToken(for: userId) else {
                return nil
            }

            let clientSSL = SSLPinning().getCertificate(server: item["url"] as? String ?? "")

            guard let usersQuery = database.query("SELECT * FROM users WHERE token == ? LIMIT 1", args: [userToken]),
                  let user = usersQuery.first else {
                return nil
            }

            guard let serverUrlString = item["url"] as? String,
                  let serverUrl = URL(string: serverUrlString),
                  let iconUrlString = item["iconURL"] as? String,
                  let iconURL = URL(string: iconUrlString) else {
                print("Invalid URL for server or icon")
                return nil
            }

            // Proceed if URLs are valid
            return WatchMessage.Server(
                url: serverUrl,
                name: item["name"] as? String ?? "",
                iconURL: iconURL,
                useRealName: (item["useRealName"] as? Int ?? 0) == 1,
                loggedUser: .init(
                    id: userId,
                    token: userToken,
                    name: user["name"] as? String ?? "",
                    username: user["username"] as? String ?? ""
                ),
                clientSSL: clientSSL.map {
                    .init(
                        certificate: $0.certificate,
                        password: $0.password
                    )
                },
                version: item["version"] as? String ?? ""
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
