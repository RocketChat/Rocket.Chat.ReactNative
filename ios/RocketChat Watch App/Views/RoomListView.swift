import SwiftUI

struct RoomListView: View {
	private let client: RocketChatClientProtocol
	private let database: Database
	private let messagesLoader: MessagesLoading
	private let messageSender: MessageSending
	private let roomsLoader: RoomsLoading
	private let router: RocketChatAppRouter
	private let server: Server
	
	@FetchRequest<Room> private var rooms: FetchedResults<Room>
	
	init(
		client: RocketChatClientProtocol,
		database: Database,
		messagesLoader: MessagesLoading,
		messageSender: MessageSending,
		roomsLoader: RoomsLoading,
		router: RocketChatAppRouter,
		server: Server
	) {
		self.client = client
		self.database = database
		self.messagesLoader = messagesLoader
		self.messageSender = messageSender
		self.roomsLoader = roomsLoader
		self.router = router
		self.server = server
		_rooms = FetchRequest(fetchRequest: server.roomsRequest)
	}
	
	var body: some View {
		List {
			ForEach(rooms) { room in
				NavigationLink(value: room) {
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
		.navigationDestination(for: Room.self) { room in
			MessageListView(
				client: client,
				database: database,
				messagesLoader: messagesLoader,
				messageSender: messageSender,
				room: room,
				server: server
			)
				.environment(\.managedObjectContext, database.viewContext)
		}
		.toolbar {
			ToolbarItem(placement: .automatic) {
				Button("Servers") {
					router.route(to: .serverList)
				}
			}
		}
	}
}
