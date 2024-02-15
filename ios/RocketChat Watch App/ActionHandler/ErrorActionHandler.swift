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
}

extension ErrorActionHandler: ErrorActionHandling {
	func handle(error: RocketChatError) {
		switch error {
		case .unauthorized:
			router.route(to: .serverList)
			
			database.remove()
			serversDB.remove(server)
		default:
			break
		}
	}
}
