import Foundation

protocol AppRouting {
	func route(to route: Route)
	func present(error: ErrorResponse)
}

final class AppRouter: ObservableObject {
	@Published private(set) var route: Route = .loading
	
	@Published var error: ErrorResponse?
}

extension AppRouter: AppRouting {
	func route(to route: Route) {
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
}
