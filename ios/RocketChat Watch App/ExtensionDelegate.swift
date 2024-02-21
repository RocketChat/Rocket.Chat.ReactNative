import WatchKit
import UserNotifications

final class ExtensionDelegate: NSObject, WKApplicationDelegate {
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
		
		NotificationResponseHolder.shared.setResponse(response)
		
		completionHandler()
	}
}

struct NotificationResponse: Codable, Hashable {
	let host: URL
	let rid: String
}

protocol NotificationResponseHolding {
	var response: NotificationResponse? { get }
	
	func setResponse(_ response: NotificationResponse)
	func clear()
}

final class NotificationResponseHolder: NotificationResponseHolding {
	static let shared = NotificationResponseHolder()
	
	private(set) var response: NotificationResponse?
	
	func setResponse(_ response: NotificationResponse) {
		self.response = response
	}
	
	func clear() {
		response = nil
	}
	
	private init() {
		
	}
}
