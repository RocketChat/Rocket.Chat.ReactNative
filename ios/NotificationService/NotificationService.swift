import UserNotifications

class NotificationService: UNNotificationServiceExtension {
  
  var contentHandler: ((UNNotificationContent) -> Void)?
  var bestAttemptContent: UNMutableNotificationContent?
  
  var retryCount = 0
  var retryTimeout = [1.0, 3.0, 5.0, 10.0]
  
  override func didReceive(_ request: UNNotificationRequest, withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void) {
    self.contentHandler = contentHandler
    bestAttemptContent = (request.content.mutableCopy() as? UNMutableNotificationContent)
    
    if let bestAttemptContent = bestAttemptContent {
      let ejson = (bestAttemptContent.userInfo["ejson"] as? String ?? "").data(using: .utf8)!
      guard let data = try? (JSONDecoder().decode(Payload.self, from: ejson)) else {
        return
      }
      
      var server = data.host
      if (server.last == "/") {
        server.removeLast()
      }
      
      // If the notification have the content at her payload, show it
      if data.notificationType != .messageIdOnly {
        return
      }
      
      var urlComponents = URLComponents(string: "\(server)/api/v1/push.get")!
      let queryItems = [URLQueryItem(name: "id", value: data.messageId)]
      urlComponents.queryItems = queryItems
      
      var request = URLRequest(url: urlComponents.url!)
      request.httpMethod = "GET"

      API(server: server).fetch(request: request) { (response: PushResponse) -> Void in
        self.processNotification(notification: response.data.notification)
      }
    }
  }
  
  func processNotification(notification: Notification) {
    if let bestAttemptContent = bestAttemptContent, let contentHandler = contentHandler {
      bestAttemptContent.title = notification.title
      bestAttemptContent.body = notification.text
      
      let payload = notification.payload
      if payload.messageType == .e2e {
        if let message = payload.msg, let rid = payload.rid {
          bestAttemptContent.body = Encryption.getInstance(server: payload.host, rid: rid).decryptMessage(message: message)
        }
      }
      
      if let payload = try? (JSONEncoder().encode(payload)) {
        bestAttemptContent.userInfo["ejson"] = String(data: payload, encoding: .utf8) ?? "{}"
      }
      
      contentHandler(bestAttemptContent)
    }
  }
  
}
