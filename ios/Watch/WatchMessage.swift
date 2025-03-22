import Foundation

struct WatchMessage: Codable {
	let servers: [Server]
	
	struct Server: Codable {
		let url: URL
		let name: String
		let iconURL: URL
		let useRealName: Bool
		let loggedUser: LoggedUser
		let clientSSL: ClientSSL?
		let version: String
		
		struct LoggedUser: Codable {
			let id: String
			let token: String
			let name: String
			let username: String
		}
		
		struct ClientSSL: Codable {
			let certificate: Data
			let password: String
		}
	}
}
