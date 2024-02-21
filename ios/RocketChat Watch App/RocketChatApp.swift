import SwiftUI
import WatchKit

@main
struct RocketChat_Watch_AppApp: App {
	@WKApplicationDelegateAdaptor var delegate: ExtensionDelegate
	
	private let router = AppRouter()
	
	init() {
		registerDependencies()
	}
	
	private func registerDependencies() {
		Store.register(AppRouting.self, factory: router)
		Store.register(ServersDatabase.self, factory: DefaultDatabase())
		Store.register(ServersLoading.self, factory: ServersLoader())
		Store.register(NotificationResponseHolding.self, factory: NotificationResponseHolder.shared)
		Store.register(Deeplinking.self, factory: Deeplink())
	}
	
	var body: some Scene {
		WindowGroup {
			AppView(router: router)
		}
	}
}
