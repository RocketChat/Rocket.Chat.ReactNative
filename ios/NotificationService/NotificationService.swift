import UserNotifications
import Intents

class NotificationService: UNNotificationServiceExtension {
    
    var contentHandler: ((UNNotificationContent) -> Void)?
    var bestAttemptContent: UNMutableNotificationContent?
    var finalContent: UNNotificationContent?
    var rocketchat: RocketChat?
    
    // MARK: - Avatar Fetching
    
    /// Fetches avatar image data from a given avatar path
    private func fetchAvatarDataFromPath(avatarPath: String, server: String, credentials: Credentials, completion: @escaping (Data?) -> Void) {
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
        
        fetchAvatarDataFromPath(avatarPath: avatarPath, server: server, credentials: credentials, completion: completion)
    }
    
    /// Fetches avatar image data for video conference caller
    func fetchCallerAvatarData(from payload: Payload, completion: @escaping (Data?) -> Void) {
        let server = payload.host.removeTrailingSlash()
        
        guard let credentials = Storage().getCredentials(server: server) else {
            completion(nil)
            return
        }
        
        // Check if caller has username (required - /avatar/{userId} endpoint doesn't exist)
        guard let username = payload.caller?.username,
              let encodedUsername = username.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) else {
            completion(nil)
            return
        }
        
        let avatarPath = "/avatar/\(encodedUsername)"
        fetchAvatarDataFromPath(avatarPath: avatarPath, server: server, credentials: credentials, completion: completion)
    }
    
    // MARK: - Communication Notification
    
    /// Updates the notification content with sender avatar using Communication Notifications API
    func updateNotificationAsCommunication(payload: Payload, avatarData: Data?) {
        guard let bestAttemptContent = bestAttemptContent else { return }
        
        let senderName = payload.sender?.name ?? payload.senderName ?? "Unknown"
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
            customIdentifier: nil
        )
        
        // Determine if this is a group or channel conversation
        let roomName = payload.name
        let isGroupOrChannel = (payload.type == .group || payload.type == .channel) && roomName != nil && !roomName!.isEmpty
        
        // Create speakable group name for group/channel conversations
        let speakableGroupName: INSpeakableString? = isGroupOrChannel && roomName != nil
            ? INSpeakableString(spokenPhrase: roomName!)
            : nil
        
        // Create a dummy recipient to ensure iOS treats this as a group conversation
        // This is necessary for iOS to use speakableGroupName instead of sender name
        let dummyRecipient = INPerson(
            personHandle: INPersonHandle(value: "placeholder", type: .unknown),
            nameComponents: nil,
            displayName: nil,
            image: nil,
            contactIdentifier: nil,
            customIdentifier: "recipient_\(payload.rid ?? "group")"
        )
        
        // Create the messaging intent
        let intent = INSendMessageIntent(
            recipients: isGroupOrChannel ? [dummyRecipient] : nil,
            outgoingMessageType: .outgoingMessageText,
            content: bestAttemptContent.body,
            speakableGroupName: speakableGroupName,
            conversationIdentifier: payload.rid ?? "",
            serviceName: nil,
            sender: sender,
            attachments: nil
        )
        
        // Set group avatar for group/channel conversations
        if isGroupOrChannel {
            intent.setImage(senderImage, forParameterNamed: \.speakableGroupName)
        }
        
        // Donate the interaction for Siri suggestions
        let interaction = INInteraction(intent: intent, response: nil)
        interaction.direction = .incoming
        interaction.donate(completion: nil)
        
        // Update the notification content with the intent
        do {
            let updatedContent = try bestAttemptContent.updating(from: intent)
            self.finalContent = updatedContent
        } catch {
            // Fallback to bestAttemptContent if intent update fails
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
                            // Set body first, processPayload will strip sender prefix for groups/channels
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
        let callerUsername = payload.caller?.username ?? ""
        
        bestAttemptContent.title = NSLocalizedString("Video Call", comment: "")
        bestAttemptContent.body = String(format: NSLocalizedString("Incoming call from %@", comment: ""), callerName)
        bestAttemptContent.categoryIdentifier = "VIDEOCONF"
        bestAttemptContent.sound = UNNotificationSound(named: UNNotificationSoundName("ringtone.mp3"))
        bestAttemptContent.interruptionLevel = .timeSensitive
        
        // Fetch caller avatar if username is available
        fetchCallerAvatarData(from: payload) { [weak self] avatarData in
            guard let self = self, let bestAttemptContent = self.bestAttemptContent else {
                self?.contentHandler?(bestAttemptContent ?? UNNotificationContent())
                return
            }
            
            // Create caller image from avatar data
            var callerImage: INImage? = nil
            if let data = avatarData {
                callerImage = INImage(imageData: data)
            }
            
            // Create caller as INPerson with avatar (similar to regular message notifications)
            let caller = INPerson(
                personHandle: INPersonHandle(value: callerUsername, type: .unknown),
                nameComponents: nil,
                displayName: callerName,
                image: callerImage,
                contactIdentifier: nil,
                customIdentifier: nil
            )
            
            // Use INSendMessageIntent to display avatar (works better than attachments for call notifications)
            // This uses the Communication Notifications API which properly displays avatars
            let intent = INSendMessageIntent(
                recipients: nil, // No recipients for incoming calls
                outgoingMessageType: .outgoingMessageText,
                content: bestAttemptContent.body,
                speakableGroupName: nil,
                conversationIdentifier: payload.rid ?? "",
                serviceName: nil,
                sender: caller, // Set caller as sender to display avatar
                attachments: nil
            )
            
            // Donate the interaction for Siri suggestions
            let interaction = INInteraction(intent: intent, response: nil)
            interaction.direction = .incoming
            interaction.donate(completion: nil)
            
            // Update the notification content with the intent to display avatar
            do {
                let updatedContent = try bestAttemptContent.updating(from: intent)
                self.contentHandler?(updatedContent)
            } catch {
                // Fallback to bestAttemptContent if intent update fails
                self.contentHandler?(bestAttemptContent)
            }
        }
    }
    
    
    func processPayload(payload: Payload) {
        // Set notification title based on payload type
        let senderName = payload.sender?.name ?? payload.senderName ?? "Unknown"
        let senderUsername = payload.sender?.username ?? payload.senderName ?? ""
        
        if let roomType = payload.type {
            switch roomType {
            case .group, .channel:
                // For groups/channels, use room name if available, otherwise fall back to sender name
                bestAttemptContent?.title = payload.name ?? senderName
                
                // Remove sender name prefix from body for groups/channels
                // Server sends body as "senderName: message", but we only want "message"
                if let body = bestAttemptContent?.body {
                    let senderPrefix = "\(senderUsername): "
                    if body.hasPrefix(senderPrefix) {
                        bestAttemptContent?.body = String(body.dropFirst(senderPrefix.count))
                    } else {
                        // Try with sender name (display name) as fallback
                        let senderNamePrefix = "\(senderName): "
                        if body.hasPrefix(senderNamePrefix) {
                            bestAttemptContent?.body = String(body.dropFirst(senderNamePrefix.count))
                        }
                    }
                }
            case .direct:
                // For direct messages, use sender name
                bestAttemptContent?.title = senderName
            case .livechat:
                // For omnichannel, use sender name
                bestAttemptContent?.title = payload.sender?.name ?? senderName
            }
        } else {
            // Fallback to sender name if type is not available
            bestAttemptContent?.title = senderName
        }
        
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
