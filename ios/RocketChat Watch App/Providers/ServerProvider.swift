import Foundation

protocol ServerProviding {
	var server: Server { get }
}

final class ServerProvider {
	@Dependency private var stateProvider: StateProviding
}

extension ServerProvider: ServerProviding {
	var server: Server {
		switch stateProvider.state {
		case .loggedIn(let server):
			return server
		case .loggedOut:
			fatalError("Attempt to get server while logged out.")
		}
	}
}
