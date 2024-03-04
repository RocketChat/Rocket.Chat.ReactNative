import SwiftUI

struct RoomListView: View {
	@Dependency private var database: Database
	@Dependency private var router: AppRouting
	
	@ObservedObject private var server: Server
	
	@EnvironmentObject private var roomsLoader: RoomsLoader
	
	@Environment(\.scenePhase) private var scenePhase
	
	@FetchRequest<Room> private var rooms: FetchedResults<Room>
	
	@State private var roomID: String?
	
	init(server: Server) {
		self.server = server
		_rooms = FetchRequest(fetchRequest: server.roomsRequest)
	}
	
	var body: some View {
		List(rooms, id: \.id) { room in
			NavigationLink(tag: room.rid, selection: $roomID) {
				MessageListView(room: room, server: server)
					.environment(\.managedObjectContext, database.viewContext)
			} label: {
				RoomView(viewModel: .init(room: room, server: server))
			}
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
		.toolbar {
			ToolbarItem(placement: .automatic) {
				Button("Servers") {
					router.route(to: .serverList)
				}
			}
		}
		.overlay {
			if roomsLoader.state == .loading {
				ProgressView()
			} else if roomsLoader.state == .error {
				Text("Could not load rooms.")
					.multilineTextAlignment(.center)
			}
		}
	}
}
