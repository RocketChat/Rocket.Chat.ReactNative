import Foundation

enum ServerListState {
	case loading
	case loaded
	case error(ConnectionError)
}

final class ServerListViewModel: ObservableObject {
	@Dependency private var connection: Connection
	@Dependency private var database: ServersDatabase
	@Dependency private var router: AppRouting
	
	@Published private(set) var state: ServerListState = .loading
	
	private func handleSuccess(message: WatchMessage) {
		message.servers.forEach(database.process(updatedServer:))
		state = .loaded
	}
	
	private func handleFailure(error: Error) {
		guard let connectionError = error as? ConnectionError else {
			return
		}
		
		state = .error(connectionError)
	}
	
	func loadServers() {
		connection.sendMessage { [weak self] result in
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
		router.route(to: .roomList(server))
	}
}
