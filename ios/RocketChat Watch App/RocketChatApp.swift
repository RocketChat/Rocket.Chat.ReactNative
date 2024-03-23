import SwiftUI
import WatchKit

@main
struct RocketChat_Watch_AppApp: App {
	@WKApplicationDelegateAdaptor var delegate: ExtensionDelegate
	
	init() {
		registerDependencies()
	}
	
	private func registerDependencies() {
		Store.register(AppRouting.self, factory: delegate.router)
		Store.register(ServersDatabase.self, factory: delegate.database)
		Store.register(ServersLoading.self, factory: ServersLoader())
	}
	
	var body: some Scene {
		WindowGroup {
			AppView(router: delegate.router)
		}
	}
}
