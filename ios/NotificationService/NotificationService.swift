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
            
            rocketchat = RocketChat(server: data.host.removeTrailingSlash())
            
            // If the notification has the content on the payload, show it
            if data.notificationType != .messageIdOnly {
                self.processPayload(payload: data)
                return
            }
            
            // Merge missing content notifications
            UNUserNotificationCenter.current().getDeliveredNotifications { deliveredNotifications in
                let identifiersToRemove = deliveredNotifications.filter {
                    $0.request.content.body == "You have a new message"
                }.map { $0.request.identifier }
                
                if identifiersToRemove.count > 0 {
                    UNUserNotificationCenter.current().removeDeliveredNotifications(withIdentifiers: identifiersToRemove)
                }
                
                // Request the content from server
                self.rocketchat?.getPushWithId(data.messageId) { notification in
                    if let notification = notification {
                        self.bestAttemptContent?.title = notification.title
                        self.bestAttemptContent?.body = notification.text
                        self.processPayload(payload: notification.payload)
                    }
                }
            }
        }
    }
    
    func processPayload(payload: Payload) {
        // If is a encrypted message
        if payload.messageType == .e2e {
            if let rid = payload.rid {
                let messageToDecrypt: String?

                if let msg = payload.msg, !msg.isEmpty {
                    messageToDecrypt = msg
                } else if let content = payload.content, content.algorithm == "rc.v1.aes-sha2" {
                    messageToDecrypt = content.ciphertext
                } else {
                    messageToDecrypt = nil
                }

                if let messageToDecrypt = messageToDecrypt, !messageToDecrypt.isEmpty {
                    if let decryptedMessage = rocketchat?.decryptMessage(rid: rid, message: messageToDecrypt) {
                        bestAttemptContent?.body = decryptedMessage
                        if let roomType = payload.type, roomType == .group, let sender = payload.senderName {
                            bestAttemptContent?.body = "\(sender): \(decryptedMessage)"
                        }
                    }
                }
            }
        }
        
        if let bestAttemptContent = bestAttemptContent {
            contentHandler?(bestAttemptContent)
        }
    }
}
