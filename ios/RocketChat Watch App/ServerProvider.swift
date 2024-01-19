import Foundation

protocol ServerProviding {
	func current() -> Server
}

final class ServerProvider {
	@Storage(.currentServer) private var currentURL: URL?
	@Dependency private var database: ServersDatabase
}

extension ServerProvider: ServerProviding {
	func current() -> Server {
		if let currentURL, let server = database.server(url: currentURL) {
			return server
		} else {
			fatalError("Attempt to get server before it was not set.")
		}
	}
}
