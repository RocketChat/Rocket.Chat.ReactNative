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
                contentHandler(bestAttemptContent)
                return
            }
            
            rocketchat = RocketChat(server: data.host.removeTrailingSlash())
            
            // Handle video conference notifications
            if data.notificationType == .videoconf {
                self.processVideoConf(payload: data, request: request)
                return
            }
            
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
                if let messageId = data.messageId {
                    self.rocketchat?.getPushWithId(messageId) { notification in
                        if let notification = notification {
                            self.bestAttemptContent?.title = notification.title
                            self.bestAttemptContent?.body = notification.text
                            self.processPayload(payload: notification.payload)
                        } else {
                            // Server returned no notification, deliver as-is
                            if let bestAttemptContent = self.bestAttemptContent {
                                self.contentHandler?(bestAttemptContent)
                            }
                        }
                    }
                } else {
                    // No messageId available, deliver the notification as-is
                    if let bestAttemptContent = self.bestAttemptContent {
                        self.contentHandler?(bestAttemptContent)
                    }
                }
            }
        }
    }
    
    func processVideoConf(payload: Payload, request: UNNotificationRequest) {
        guard let bestAttemptContent = bestAttemptContent else {
            return
        }
        
        // Status 4 means call cancelled/ended - remove any existing notification
        if payload.status == 4 {
            if let rid = payload.rid, let callerId = payload.caller?._id {
                let notificationId = "\(rid)\(callerId)".replacingOccurrences(of: "[^A-Za-z0-9]", with: "", options: .regularExpression)
                UNUserNotificationCenter.current().removeDeliveredNotifications(withIdentifiers: [notificationId])
            }
            // Don't show anything for cancelled calls
            contentHandler?(UNNotificationContent())
            return
        }
        
        // Status 0 (or nil) means incoming call - show notification with actions
        let callerName = payload.caller?.name ?? "Unknown"
        
        bestAttemptContent.title = NSLocalizedString("Video Call", comment: "")
        bestAttemptContent.body = String(format: NSLocalizedString("Incoming call from %@", comment: ""), callerName)
        bestAttemptContent.categoryIdentifier = "VIDEOCONF"
        bestAttemptContent.sound = UNNotificationSound(named: UNNotificationSoundName("ringtone.mp3"))
        if #available(iOS 15.0, *) {
            bestAttemptContent.interruptionLevel = .timeSensitive
        }
        
        contentHandler?(bestAttemptContent)
    }
    
    func processPayload(payload: Payload) {
        // If is a encrypted message
        if payload.messageType == .e2e {
            if let rid = payload.rid {
                let decryptedMessage: String?
                
                if let content = payload.content, (content.algorithm == "rc.v1.aes-sha2" || content.algorithm == "rc.v2.aes-sha2") {
                    decryptedMessage = rocketchat?.decryptContent(rid: rid, content: content)
                } else if let msg = payload.msg, !msg.isEmpty {
                    // Fallback to msg field
                    decryptedMessage = rocketchat?.decryptContent(rid: rid, content: EncryptedContent(algorithm: "rc.v1.aes-sha2", ciphertext: msg, kid: nil, iv: nil))
                } else {
                    decryptedMessage = nil
                }
                
                if let decryptedMessage = decryptedMessage {
                    bestAttemptContent?.body = decryptedMessage
                    if let roomType = payload.type, roomType == .group, let sender = payload.senderName {
                            bestAttemptContent?.body = "\(sender): \(decryptedMessage)"
                    }
                }
            }
        }
        
        if let bestAttemptContent = bestAttemptContent {
            contentHandler?(bestAttemptContent)
        }
    }
}
