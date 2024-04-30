import SwiftUI

struct RoomListView: View {
	@Dependency private var database: Database
	
	@EnvironmentObject private var router: AppRouter
	
	@ObservedObject private var server: Server
	
	@StateObject private var roomsLoader: RoomsLoader
	
	@Environment(\.scenePhase) private var scenePhase
	
	@FetchRequest<Room> private var rooms: FetchedResults<Room>
	
	init(server: Server, roomsLoader: RoomsLoader) {
		self.server = server
		_roomsLoader = StateObject(wrappedValue: roomsLoader)
		_rooms = FetchRequest(fetchRequest: server.roomsRequest)
	}
	
	var body: some View {
		List(rooms, id: \.id) { room in
			RoomView(viewModel: .init(room: room, server: server))
				.onTapGesture {
					router.route(to: .room(server, room))
				}
		}
		.navigationDestination(for: $router.room) { room in
			MessageListView(room: room, server: server)
				.environment(\.managedObjectContext, database.viewContext)
		}
		.onAppear {
			roomsLoader.start()
		}
		.onDisappear {
			roomsLoader.stop()
		}
		.onChange(of: scenePhase) { phase in
			switch phase {
			case .active:
				roomsLoader.start()
			case .background, .inactive:
				roomsLoader.stop()
			@unknown default:
				break
			}
		}
		.navigationTitle("Rooms")
		.navigationBarTitleDisplayMode(.inline)
		.overlay {
			switch roomsLoader.state {
			case .loaded:
				EmptyView()
			case .loading:
				ProgressView()
			case .error:
				Text("Could not load rooms.")
					.multilineTextAlignment(.center)
			}
		}
	}
}
