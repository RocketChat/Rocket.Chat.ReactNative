import UserNotifications

class NotificationService: UNNotificationServiceExtension {
  
  var contentHandler: ((UNNotificationContent) -> Void)?
  var bestAttemptContent: UNMutableNotificationContent?
  
  override func didReceive(_ request: UNNotificationRequest, withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void) {
    self.contentHandler = contentHandler
    bestAttemptContent = (request.content.mutableCopy() as? UNMutableNotificationContent)
    
    if let bestAttemptContent = bestAttemptContent {
      let ejson = (bestAttemptContent.userInfo["ejson"] as? String ?? "").data(using: .utf8)!
      guard let data = try? (JSONDecoder().decode(Payload.self, from: ejson)) else {
        return
      }
      
      // If the notification have the content at her payload, show it
      if data.notificationType != .messageIdOnly {
        self.processPayload(payload: data)
        return
      }
      
      // Request the content from server
      let rocketchat = RocketChat.current(server: data.host)
      rocketchat.getPushWithId(data.messageId) { notification in
        if let notification = notification {
          self.bestAttemptContent?.title = notification.title
          self.bestAttemptContent?.body = notification.text
          self.processPayload(payload: notification.payload)
        }
      }
    }
  }
  
  func processPayload(payload: Payload) {
    if let bestAttemptContent = bestAttemptContent, let contentHandler = contentHandler {
      // If it's a encrypted message
      if payload.messageType == .e2e {
        if let message = payload.msg, let rid = payload.rid {
          // Decrypt the message and set the decrypted content on notification body
          let rocketchat = RocketChat.current(server: payload.host)
          bestAttemptContent.body = rocketchat.decryptMessage(rid: rid, message: message)
        }
      }
      
      contentHandler(bestAttemptContent)
    }
  }
  
}
