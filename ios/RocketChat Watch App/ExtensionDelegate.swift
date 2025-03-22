import WatchKit
import UserNotifications

final class ExtensionDelegate: NSObject, WKApplicationDelegate {
	let router = AppRouter()
	let database = DefaultDatabase()
	
	func applicationDidFinishLaunching() {
		UNUserNotificationCenter.current().delegate = self
	}
}

extension ExtensionDelegate: UNUserNotificationCenterDelegate {
	func userNotificationCenter(
		_ center: UNUserNotificationCenter,
		didReceive response: UNNotificationResponse,
		withCompletionHandler completionHandler: @escaping () -> Void
	) {
		let userInfo = response.notification.request.content.userInfo
		let ejson = userInfo["ejson"] as? String
		let data = ejson?.data(using: .utf8)
		
		guard let response = try? data?.decode(NotificationResponse.self) else { return }
		
		deeplink(from: response)
		
		completionHandler()
	}
}

extension ExtensionDelegate {
	private func deeplink(from response: NotificationResponse) {
		guard let server = database.server(url: response.host) else { return }
		guard let room = server.database.room(rid: response.rid) else { return }
		
		router.route(to: [.loading, .roomList(server), .room(server, room)])
	}
}

struct NotificationResponse: Codable, Hashable {
	let host: URL
	let rid: String
}
