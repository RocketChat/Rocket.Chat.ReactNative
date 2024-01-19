import SwiftUI

@main
struct RocketChat_Watch_AppApp: App {
	private let store: DependencyStore
	
	@StateObject var router: RocketChatAppRouter
	
	init() {
		let store = DependencyStore()
		
		self.store = store
		self._router = StateObject(wrappedValue: RocketChatAppRouter(database: store.database))
	}
	
	@ViewBuilder
	private var serverListView: some View {
		ServerListView(
			dependencies: .init(
				connection: store.connection,
				database: store.database,
				router: router
			)
		)
	}
	
	@ViewBuilder
	private func roomListView(for server: Server) -> some View {
		RoomListView(
			client: store.client(for: server),
			database: store.database(for: server),
			messagesLoader: MessagesLoader(
				client: store.client(for: server),
				database: store.database(for: server),
				serversDB: store.database
			),
			messageSender: MessageSender(
				client: store.client(for: server),
				database: store.database(for: server),
				server: server
			),
			roomsLoader: RoomsLoader(
				client: store.client(for: server),
				database: store.database(for: server),
				serversDB: store.database
			),
			router: router,
			server: server
		)
	}
	
	var body: some Scene {
		WindowGroup {
			NavigationStack {
				switch router.route {
					case .roomList(let server):
						roomListView(for: server)
							.environment(\.managedObjectContext, store.database(for: server).viewContext)
					case .serverList:
						serverListView
							.environment(\.managedObjectContext, store.database.viewContext)
				}
			}
		}
	}
}
