import Foundation

protocol AppRouting {
	func route(to route: Route)
}

final class AppRouter: ObservableObject {
	@Published private(set) var route: Route = .loading
}

extension AppRouter: AppRouting {
	func route(to route: Route) {
		self.route = route
	}
}

enum Route: Equatable {
	case loading
	case serverList
	case roomList(Server)
}
