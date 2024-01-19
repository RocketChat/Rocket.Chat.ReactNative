import Foundation

protocol AppRouting {
	func route(to route: Route)
}

final class AppRouter: ObservableObject {
	@Storage(.currentServer) private var currentURL: URL?
	
	@Published private(set) var route: Route = .serverList
}

extension AppRouter: AppRouting {
	func route(to route: Route) {
		switch route {
		case .roomList(let server):
			currentURL = server.url
		case .serverList:
			break
		}
		
		self.route = route
	}
}

enum Route {
	case serverList
	case roomList(Server)
}
