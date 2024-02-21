import SwiftUI

struct LoggedInView: View {
	@Dependency private var router: AppRouting
	
	private let database: Database
	private let server: Server
	
	init(server: Server) {
		self.server = server
		self.database = RocketChatDatabase(server: server)
		
		registerDependencies()
	}
	
	private func registerDependencies() {
		Store.register(Database.self, factory: database)
		Store.register(RocketChatClientProtocol.self, factory: RocketChatClient(server: server))
		Store.register(MessageSending.self, factory: MessageSender(server: server))
		Store.register(ErrorActionHandling.self, factory: ErrorActionHandler(server: server))
		Store.register(RoomsLoading.self, factory: RoomsLoader(server: server))
		Store.register(MessagesLoading.self, factory: MessagesLoader())
	}
	
	var body: some View {
		RoomListView(server: server)
			.environment(\.managedObjectContext, database.viewContext)
	}
}
