import SwiftUI

struct AppView: View {
	@Dependency private var database: ServersDatabase
	@Dependency private var stateProvider: StateProviding
	
	@StateObject private var router: AppRouter
	
	init(router: AppRouter) {
		_router = StateObject(wrappedValue: router)
	}
	
	var body: some View {
		NavigationStack {
			switch router.route {
			case .loading:
				ProgressView()
			case .roomList(let server):
				LoggedInView(server: server)
			case .serverList:
				ServerListView()
					.environment(\.managedObjectContext, database.viewContext)
			}
		}
		.onChange(of: router.route) { newValue in
			switch newValue {
			case .roomList(let server):
				stateProvider.update(to: .loggedIn(server))
			case .serverList, .loading:
				stateProvider.update(to: .loggedOut)
			}
		}
		.onAppear {
			loadRoute()
		}
	}
	
	private func loadRoute() {
		switch stateProvider.state {
		case .loggedIn(let server):
			router.route(to: .roomList(server))
		case .loggedOut:
			router.route(to: .serverList)
		}
	}
}
