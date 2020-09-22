import UserNotifications

class NotificationService: UNNotificationServiceExtension {
  
  var contentHandler: ((UNNotificationContent) -> Void)?
  var bestAttemptContent: UNMutableNotificationContent?
  var rocketchat: RocketChat?
  
  override func didReceive(_ request: UNNotificationRequest, withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void) {
    self.contentHandler = contentHandler
    bestAttemptContent = (request.content.mutableCopy() as? UNMutableNotificationContent)
    
    if let bestAttemptContent = bestAttemptContent {
      let ejson = (bestAttemptContent.userInfo["ejson"] as? String ?? "").data(using: .utf8)!
      guard let data = try? (JSONDecoder().decode(Payload.self, from: ejson)) else {
        return
      }
      
      rocketchat = RocketChat.instanceForServer(server: data.host)
      
      // If the notification have the content at her payload, show it
      if data.notificationType != .messageIdOnly {
        self.processPayload(payload: data)
        return
      }
      
      // Request the content from server
      rocketchat?.getPushWithId(data.messageId) { notification in
        if let notification = notification {
          self.bestAttemptContent?.title = notification.title
          self.bestAttemptContent?.body = notification.text
          self.processPayload(payload: notification.payload)
        }
      }
    }
  }
  
  func processPayload(payload: Payload) {
    // If is a encrypted message
    if payload.messageType == .e2e {
      if let message = payload.msg, let rid = payload.rid {
        if let decryptedMessage = rocketchat?.decryptMessage(rid: rid, message: message) {
          var body = decryptedMessage
          if let roomType = payload.type, roomType == .group, let sender = payload.senderName {
            body = "\(sender): \(decryptedMessage)"
          }
          bestAttemptContent?.body = body
        }
      }
    }
    
    if let bestAttemptContent = bestAttemptContent {
      contentHandler?(bestAttemptContent)
    }
  }
}
