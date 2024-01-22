import SwiftUI

struct RoomListView: View {
	@Dependency private var client: RocketChatClientProtocol
	@Dependency private var database: Database
	@Dependency private var messagesLoader: MessagesLoading
	@Dependency private var messageSender: MessageSending
	@Dependency private var roomsLoader: RoomsLoading
	@Dependency private var router: AppRouting
	
	private let server: Server
	
	@FetchRequest<Room> private var rooms: FetchedResults<Room>
	
	init(server: Server) {
		self.server = server
		_rooms = FetchRequest(fetchRequest: server.roomsRequest)
	}
	
	var body: some View {
		List {
			ForEach(rooms) { room in
				NavigationLink {
					MessageListView(
						client: client,
						database: database,
						messagesLoader: messagesLoader,
						messageSender: messageSender,
						room: room,
						server: server
					)
						.environment(\.managedObjectContext, database.viewContext)
				} label: {
					RoomView(viewModel: .init(room: room, server: server))
				}
			}
		}
		.onAppear {
			roomsLoader.start(in: server.url)
		}
		.onDisappear {
			roomsLoader.stop()
		}
		.navigationTitle("Rooms")
		.navigationBarTitleDisplayMode(.inline)
		.toolbar {
			ToolbarItem(placement: .automatic) {
				Button("Servers") {
					router.route(to: .serverList)
				}
			}
		}
	}
}
