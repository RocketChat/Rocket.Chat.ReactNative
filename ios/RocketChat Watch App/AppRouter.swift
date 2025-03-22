import Foundation

protocol AppRouting {
	func route(to route: Route)
	func present(error: ErrorResponse)
	func route(to routes: [Route], completion: (() -> Void)?)
}

final class AppRouter: ObservableObject {
	@Published var error: ErrorResponse?
	
	@Published var server: Server? {
		didSet {
			if server != oldValue, let server {
				registerDependencies(in: server)
			}
		}
	}
	
	@Published var room: Room?
	
	@Storage(.currentServer) private var currentURL: URL?
	
	private func registerDependencies(in server: Server) {
		Store.register(Database.self, factory: server.database)
		Store.register(RocketChatClientProtocol.self, factory: RocketChatClient(server: server))
		Store.register(MessageSending.self, factory: MessageSender(server: server))
		Store.register(ErrorActionHandling.self, factory: ErrorActionHandler(server: server))
		Store.register(MessagesLoading.self, factory: MessagesLoader())
		Store.register(RoomsLoader.self, factory: RoomsLoader(server: server))
	}
}

extension AppRouter: AppRouting {
	func route(to route: Route) {
		switch route {
		case .roomList(let selectedServer):
			currentURL = selectedServer.url
			room = nil
			server = selectedServer
		case .room(let selectedServer, let selectedRoom):
			currentURL = selectedServer.url
			server = selectedServer
			room = selectedRoom
		case .serverList:
			currentURL = nil
			room = nil
			server = nil
		case .loading:
			room = nil
			server = nil
		}
	}
	
	func present(error: ErrorResponse) {
		guard self.error == nil else {
			return
		}
		
		self.error = error
	}
}

extension AppRouter {
	func route(to routes: [Route], completion: (() -> Void)? = nil) {
		guard let routeTo = routes.first else {
			completion?()
			return
		}
		
		DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
			self.route(to: routeTo)
			self.route(to: Array(routes[1..<routes.count]), completion: completion)
		}
	}
}

enum Route: Equatable {
	case loading
	case serverList
	case roomList(Server)
	case room(Server, Room)
}
