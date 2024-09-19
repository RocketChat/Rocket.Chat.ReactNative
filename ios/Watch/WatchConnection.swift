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
    
    private func getServers() -> [DBServer]? {
        guard let serversQuery = database.query("select * from servers") else {
            print("No servers found")
            return nil
        }
        
        if let data = try? JSONSerialization.data(withJSONObject: serversQuery, options: []) {
            do {
                let servers = try JSONDecoder().decode([DBServer].self, from: data)
                return servers
            } catch {
                print("Failed to decode DBServer: \(error)")
                return nil
            }
        } else {
            print("Failed to serialize query result to data.")
            return nil
        }
    }
    
    private func getUsers(userToken: String) -> [DBUser]? {
        guard let usersQuery = database.query("select * from users where token == ? limit 1", args: [userToken]) else {
            print("No users found")
            return nil
        }
        
        if let data = try? JSONSerialization.data(withJSONObject: usersQuery, options: []) {
            do {
                let users = try JSONDecoder().decode([DBUser].self, from: data)
                return users
            } catch {
                print("Failed to decode DBServer: \(error)")
                return nil
            }
        } else {
            print("Failed to serialize query result to data.")
            return nil
        }
    }
    
    private func getMessage() -> WatchMessage? {
        guard let serversQuery = getServers() else {
            return nil
        }

        let servers = serversQuery.compactMap { item -> WatchMessage.Server? in
            guard let userId = mmkv.userId(for: item.identifier), let userToken = mmkv.userToken(for: userId) else {
                return nil
            }

            let clientSSL = SSLPinning().getCertificate(server: item.url.absoluteString.removeTrailingSlash())

            guard let usersQuery = getUsers(userToken: userToken) else {
                return nil
            }

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
            guard let message = getMessage() else {
                fatalError("Message is null")
            }
            let data = try JSONEncoder().encode(message)
            
            guard let dictionary = try JSONSerialization.jsonObject(with: data, options: .allowFragments) as? [String: Any] else {
                fatalError("Could not serialize message: \(message)")
            }
            
            return dictionary
        } catch {
            fatalError("Could not encode message")
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
