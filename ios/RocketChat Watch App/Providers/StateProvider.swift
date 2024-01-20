import Foundation

enum AppState {
	case loggedIn(Server)
	case loggedOut
}

protocol StateProviding {
	var state: AppState { get }
	
	func update(to state: AppState)
}

final class StateProvider: StateProviding {
	@Storage(.currentServer) private var currentURL: URL?
	
	@Dependency private var database: ServersDatabase
	
	var state: AppState {
		if let currentURL, let server = database.server(url: currentURL) {
			return .loggedIn(server)
		} else if database.servers().count == 1, let server = database.servers().first {
			return .loggedIn(server)
		} else {
			return .loggedOut
		}
	}
	
	func update(to state: AppState) {
		switch state {
		case .loggedIn(let server):
			currentURL = server.url
		case .loggedOut:
			break
		}
	}
}
