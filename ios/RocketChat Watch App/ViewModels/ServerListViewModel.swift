import Foundation

enum ServerListState {
	case loading
	case loaded
	case error(ConnectionError)
}

final class ServerListViewModel: ObservableObject {
	struct Dependencies {
		let connection: Connection
		let database: ServersDatabase
		let router: RocketChatAppRouter
	}
	
	private let dependencies: Dependencies
	
	@Published private(set) var state: ServerListState = .loading
	
	init(dependencies: Dependencies) {
		self.dependencies = dependencies
	}
	
	private func handleSuccess(message: WatchMessage) {
		message.servers.forEach(dependencies.database.process(updatedServer:))
		state = .loaded
	}
	
	private func handleFailure(error: Error) {
		guard let connectionError = error as? ConnectionError else {
			return
		}
		
		state = .error(connectionError)
	}
	
	func loadServers() {
		dependencies.connection.sendMessage { [weak self] result in
			guard let self else {
				return
			}
			
			switch result {
				case .success(let message):
					DispatchQueue.main.async { self.handleSuccess(message: message) }
				case .failure(let error):
					DispatchQueue.main.async { self.handleFailure(error: error) }
			}
		}
	}
	
	func didTap(server: Server) {
		dependencies.router.route(to: .roomList(server))
	}
}
