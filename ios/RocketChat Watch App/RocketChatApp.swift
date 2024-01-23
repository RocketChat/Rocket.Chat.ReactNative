import SwiftUI

@main
struct RocketChat_Watch_AppApp: App {
	private let router = AppRouter()
	
	init() {
		registerDependencies()
	}
	
	private func registerDependencies() {
		Store.register(AppRouting.self, factory: router)
		Store.register(ServersDatabase.self, factory: DefaultDatabase())
		Store.register(ServersLoading.self, factory: ServersLoader())
		Store.register(MessagesLoading.self, factory: MessagesLoader())
		Store.register(RoomsLoading.self, factory: RoomsLoader())
	}
	
	var body: some Scene {
		WindowGroup {
			AppView(router: router)
		}
	}
}
