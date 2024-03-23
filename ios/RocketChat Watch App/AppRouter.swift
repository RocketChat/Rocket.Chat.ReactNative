import Foundation

protocol AppRouting {
	func route(to route: Route)
	func present(error: ErrorResponse)
}

final class AppRouter: ObservableObject {
	@Published private(set) var route: Route = .loading
	
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
		Store.register(Database.self, factory: RocketChatDatabase(server: server))
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
		
		self.route = route
	}
	
	func present(error: ErrorResponse) {
		guard self.error == nil else {
			return
		}
		
		self.error = error
	}
}

enum Route: Equatable {
	case loading
	case serverList
	case roomList(Server)
	case room(Server, Room)
}
