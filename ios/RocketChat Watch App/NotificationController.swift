import SwiftUI
import UserNotifications
import WatchKit

struct NotificationView: View {
  let title: String?
  let message: String?
  
  var body: some View {
    VStack(alignment: .leading) {
      Text(title ?? "")
        .font(.caption)
        .fontWeight(.bold)
        .foregroundStyle(.primary)
        .multilineTextAlignment(.leading)
        .frame(maxWidth: .infinity)
      Text(message ?? "")
        .font(.caption)
        .foregroundStyle(.primary)
        .multilineTextAlignment(.leading)
        .frame(maxWidth: .infinity)
    }
  }
}

final class NotificationController: WKUserNotificationHostingController<NotificationView> {
  private var title: String?
  private var message: String?
  
  override var body: NotificationView {
    NotificationView(title: title, message: message)
  }
  
  override func didReceive(_ notification: UNNotification) {
    let notificationData = notification.request.content.userInfo as? [String: Any]
    let aps = notificationData?["aps"] as? [String: Any]
    let alert = aps?["alert"] as? [String: Any]

    title = alert?["title"] as? String
    message = alert?["body"] as? String
  }
  
  override func suggestionsForResponseToAction(
    withIdentifier identifier: String,
    for notification: UNNotification,
    inputLanguage: String
  ) -> [String] {
    [
      "message-1",
      "message-2",
      "message-3",
      "message-4",
      "message-5",
      "message-6",
      "message-7",
      "message-8"
    ]
  }
}
