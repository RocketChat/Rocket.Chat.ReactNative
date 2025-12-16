import UserNotifications
import Intents

class NotificationService: UNNotificationServiceExtension {
    
    var contentHandler: ((UNNotificationContent) -> Void)?
    var bestAttemptContent: UNMutableNotificationContent?
    var finalContent: UNNotificationContent?
    var rocketchat: RocketChat?
    
    // MARK: - Avatar Fetching
    
    /// Fetches avatar image data - sender's avatar for DMs, room avatar for groups/channels
    func fetchAvatarData(from payload: Payload, completion: @escaping (Data?) -> Void) {
        let server = payload.host.removeTrailingSlash()
        
        guard let credentials = Storage().getCredentials(server: server) else {
            completion(nil)
            return
        }
        
        // Build avatar path based on room type
        let avatarPath: String
        
        if payload.type == .direct {
            // Direct message: use sender's avatar
            guard let username = payload.sender?.username,
                  let encodedUsername = username.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) else {
                completion(nil)
                return
            }
            avatarPath = "/avatar/\(encodedUsername)"
        } else {
            // Group/Channel/Livechat: use room avatar
            guard let rid = payload.rid else {
                completion(nil)
                return
            }
            avatarPath = "/avatar/room/\(rid)"
        }
        
        let fullPath = "\(avatarPath)?format=png&size=100&rc_token=\(credentials.userToken)&rc_uid=\(credentials.userId)"
        guard let avatarURL = URL(string: server + fullPath) else {
            completion(nil)
            return
        }
        
        // Create request with 3-second timeout
        var request = URLRequest(url: avatarURL, timeoutInterval: 3)
        request.httpMethod = "GET"
        request.addValue(Bundle.userAgent, forHTTPHeaderField: "User-Agent")
        
        let task = URLSession.shared.dataTask(with: request) { data, response, error in
            guard error == nil,
                  let httpResponse = response as? HTTPURLResponse,
                  httpResponse.statusCode == 200,
                  let data = data else {
                completion(nil)
                return
            }
            completion(data)
        }
        task.resume()
    }
    
    // MARK: - Communication Notification
    
    /// Updates the notification content with sender avatar using Communication Notifications API
    func updateNotificationAsCommunication(payload: Payload, avatarData: Data?) {
        guard let bestAttemptContent = bestAttemptContent else { return }
        
        let senderName = payload.sender?.name ?? payload.senderName ?? "Unknown"
        let senderId = payload.sender?._id ?? ""
        let senderUsername = payload.sender?.username ?? ""
        
        // Create avatar image for the sender
        var senderImage: INImage? = nil
        if let data = avatarData {
            senderImage = INImage(imageData: data)
        }
        
        // Create the sender as an INPerson
        let sender = INPerson(
            personHandle: INPersonHandle(value: senderUsername, type: .unknown),
            nameComponents: nil,
            displayName: senderName,
            image: senderImage,
            contactIdentifier: nil,
            customIdentifier: senderId
        )
        
        // Determine conversation name (room name for groups, sender name for DMs)
        let conversationName: String
        if payload.type == .group, let roomName = payload.name {
            conversationName = roomName
        } else {
            conversationName = senderName
        }
        
        // Create the messaging intent
        let intent = INSendMessageIntent(
            recipients: nil,
            outgoingMessageType: .outgoingMessageText,
            content: bestAttemptContent.body,
            speakableGroupName: INSpeakableString(spokenPhrase: conversationName),
            conversationIdentifier: payload.rid ?? "",
            serviceName: nil,
            sender: sender,
            attachments: nil
        )
        
        // If it's a group chat, set the group avatar
        if payload.type == .group {
            intent.setImage(senderImage, forParameterNamed: \.speakableGroupName)
        }
        
        // Donate the interaction for Siri suggestions
        let interaction = INInteraction(intent: intent, response: nil)
        interaction.direction = .incoming
        interaction.donate(completion: nil)
        
        // Update the notification content with the intent
        do {
            let updatedContent = try bestAttemptContent.updating(from: intent)
            // Store the updated content directly - don't use mutableCopy() as it strips the intent association
            self.finalContent = updatedContent
        } catch {
            // Keep bestAttemptContent as fallback
            self.finalContent = bestAttemptContent
        }
    }
    
    override func didReceive(_ request: UNNotificationRequest, withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void) {
        self.contentHandler = contentHandler
        bestAttemptContent = (request.content.mutableCopy() as? UNMutableNotificationContent)
        
        if let bestAttemptContent = bestAttemptContent {
            guard let ejsonString = bestAttemptContent.userInfo["ejson"] as? String,
                  let ejson = ejsonString.data(using: .utf8),
                  let data = try? JSONDecoder().decode(Payload.self, from: ejson) else {
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
                            
                            // Update ejson with full payload from server for correct navigation
                            if let payloadData = try? JSONEncoder().encode(notification.payload),
                               let payloadString = String(data: payloadData, encoding: .utf8) {
                                self.bestAttemptContent?.userInfo["ejson"] = payloadString
                            }
                            
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
        bestAttemptContent.interruptionLevel = .timeSensitive
        
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
        
        // Fetch avatar and deliver notification with Communication Notification style
        fetchAvatarData(from: payload) { [weak self] avatarData in
            guard let self = self else { return }
            
            self.updateNotificationAsCommunication(payload: payload, avatarData: avatarData)
            
            // Deliver finalContent (with intent) if available, otherwise fall back to bestAttemptContent
            if let content = self.finalContent {
                self.contentHandler?(content)
            } else if let bestAttemptContent = self.bestAttemptContent {
                self.contentHandler?(bestAttemptContent)
            }
        }
    }
}
