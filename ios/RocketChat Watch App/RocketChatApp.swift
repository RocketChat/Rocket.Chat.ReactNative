import SwiftUI

@main
struct RocketChat_Watch_AppApp: App {
	private let router = AppRouter()
	
	init() {
		registerDependencies()
	}
	
	private func registerDependencies() {
		Store.register(ServersDatabase.self, factory: DefaultDatabase())
		Store.register(ServerProviding.self, factory: ServerProvider())
		Store.register(Connection.self, factory: WatchConnection(session: .default))
		Store.register(RocketChatClientProtocol.self, factory: RocketChatClient())
		Store.register(Database.self, factory: RocketChatDatabase())
		Store.register(MessagesLoading.self, factory: MessagesLoader())
		Store.register(MessageSending.self, factory: MessageSender())
		Store.register(RoomsLoading.self, factory: RoomsLoader())
		Store.register(AppRouting.self, factory: router)
	}
	
	var body: some Scene {
		WindowGroup {
			AppView(router: router)
		}
	}
}
