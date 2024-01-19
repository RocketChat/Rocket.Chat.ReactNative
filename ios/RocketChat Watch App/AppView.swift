import SwiftUI

struct AppView: View {
	@Dependency private var database: Database
	@Dependency private var serversDB: ServersDatabase
	
	@Storage(.currentServer) private var currentURL: URL?
	
	@StateObject private var router: AppRouter
	
	init(router: AppRouter) {
		_router = StateObject(wrappedValue: router)
	}
	
	var body: some View {
		NavigationStack {
			switch router.route {
				case .roomList(let server):
					RoomListView(server: server)
						.environment(\.managedObjectContext, database.viewContext)
				case .serverList:
					ServerListView(viewModel: ServerListViewModel())
						.environment(\.managedObjectContext, serversDB.viewContext)
			}
		}
		.onAppear {
			loadRoute()
		}
	}
	
	private func loadRoute() {
		if let currentURL, let server = serversDB.server(url: currentURL) {
			router.route(to: .roomList(server))
		} else if serversDB.servers().count == 1, let server = serversDB.servers().first {
			router.route(to: .roomList(server))
		} else {
			router.route(to: .serverList)
		}
	}
}
