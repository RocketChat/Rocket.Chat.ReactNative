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
      API(server: data.host)?.fetch(request: PushRequest(msgId: data.messageId)) { (response: PushResponse) -> Void in
        let notification = response.data.notification

        self.bestAttemptContent?.title = notification.title
        self.bestAttemptContent?.body = notification.text
        
        self.processPayload(payload: notification.payload)
      }
    }
  }
  
  func processPayload(payload: Payload) {
    if let bestAttemptContent = bestAttemptContent, let contentHandler = contentHandler {
      // If is a encrypted message
      if payload.messageType == .e2e {
        if let message = payload.msg, let rid = payload.rid {
          // Decrypt the message and set the decrypted content on notification body
          bestAttemptContent.body = Encryption.getInstance(server: payload.host, rid: rid).decryptMessage(message: message)
        }
      }
      
      contentHandler(bestAttemptContent)
    }
  }
  
}
