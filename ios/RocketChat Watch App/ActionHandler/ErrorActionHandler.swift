import Foundation

protocol ErrorActionHandling {
	func handle(error: RocketChatError)
}

final class ErrorActionHandler {
	@Dependency private var database: Database
	@Dependency private var serversDB: ServersDatabase
	@Dependency private var router: AppRouting
	
	private let server: Server
	
	init(server: Server) {
		self.server = server
	}
	
	private func handleOnMain(error: RocketChatError) {
		switch error {
		case .server(let response):
			router.present(error: response)
		case .unauthorized:
			router.route(to: [.loading, .serverList]) {
				self.database.remove()
				self.serversDB.remove(self.server)
			}
		case .unknown:
			print("Unexpected error on Client.")
		}
	}
}

extension ErrorActionHandler: ErrorActionHandling {
	func handle(error: RocketChatError) {
		DispatchQueue.main.async {
			self.handleOnMain(error: error)
		}
	}
}
