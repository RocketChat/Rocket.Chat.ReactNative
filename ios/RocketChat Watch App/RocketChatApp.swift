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
		Store.register(StateProviding.self, factory: StateProvider())
		Store.register(ServersLoading.self, factory: ServersLoader(session: .default))
		Store.register(MessagesLoading.self, factory: MessagesLoader())
		Store.register(RoomsLoading.self, factory: RoomsLoader())
	}
	
	var body: some Scene {
		WindowGroup {
			AppView(router: router)
		}
	}
}
