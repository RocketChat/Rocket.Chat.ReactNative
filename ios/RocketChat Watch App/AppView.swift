import SwiftUI

struct AppView: View {
	@Storage(.currentServer) private var currentURL: URL?
	
	@Dependency private var database: ServersDatabase
	
	@StateObject private var router: AppRouter
	
	init(router: AppRouter) {
		_router = StateObject(wrappedValue: router)
	}
	
	var body: some View {
		NavigationView {
			ServerListView()
				.environmentObject(router)
				.environment(\.managedObjectContext, database.viewContext)
		}
		.onAppear {
			loadRoute()
		}
		.sheet(item: $router.error) { error in
			Text(error.error)
				.multilineTextAlignment(.center)
				.padding()
		}
	}
	
	private func loadRoute() {
		if let currentURL, let server = database.server(url: currentURL) {
			router.route(to: .roomList(server))
		} else if database.servers().count == 1, let server = database.servers().first {
			router.route(to: .roomList(server))
		} else {
			router.route(to: .serverList)
		}
	}
}
