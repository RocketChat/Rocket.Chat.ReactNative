import UserNotifications
import Intents

class NotificationService: UNNotificationServiceExtension {
    
    var contentHandler: ((UNNotificationContent) -> Void)?
    var bestAttemptContent: UNMutableNotificationContent?
    var finalContent: UNNotificationContent?
    var rocketchat: RocketChat?
    
    // MARK: - Notification Lifecycle
    
    override func didReceive(_ request: UNNotificationRequest, withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void) {
        self.contentHandler = contentHandler
        bestAttemptContent = (request.content.mutableCopy() as? UNMutableNotificationContent)
        
        guard let bestAttemptContent = bestAttemptContent,
              let ejsonString = bestAttemptContent.userInfo["ejson"] as? String,
              let ejson = ejsonString.data(using: .utf8),
              let payload = try? JSONDecoder().decode(Payload.self, from: ejson) else {
            contentHandler(request.content)
            return
        }
        
        rocketchat = RocketChat(server: payload.host.removeTrailingSlash())
        
        if payload.notificationType == .videoconf {
            processVideoConf(payload: payload)
        } else if payload.notificationType == .messageIdOnly {
            fetchMessageContent(payload: payload)
        } else {
            processPayload(payload: payload)
        }
    }
    
    // MARK: - Processors
    
    func processVideoConf(payload: Payload) {
        guard let bestAttemptContent = bestAttemptContent else { return }
        
        // Handle Cancelled Calls
        if payload.status == 4 {
            if let rid = payload.rid, let callerId = payload.caller?._id {
                let notificationId = "\(rid)\(callerId)".replacingOccurrences(of: "[^A-Za-z0-9]", with: "", options: .regularExpression)
                UNUserNotificationCenter.current().removeDeliveredNotifications(withIdentifiers: [notificationId])
            }
            contentHandler?(UNNotificationContent())
            return
        }
        
        // 1. Setup Basic Content
        let callerName = payload.caller?.name ?? "Unknown"
        bestAttemptContent.title = NSLocalizedString("Video Call", comment: "")
        bestAttemptContent.body = String(format: NSLocalizedString("Incoming call from %@", comment: ""), callerName)
        bestAttemptContent.categoryIdentifier = "VIDEOCONF"
        bestAttemptContent.sound = UNNotificationSound(named: UNNotificationSoundName("ringtone.mp3"))
        bestAttemptContent.interruptionLevel = .timeSensitive
        
        // 2. Fetch Avatar & Activate Intent
        fetchCallerAvatarData(from: payload) { [weak self] avatarData in
            guard let self = self else { return }
            
            self.activateCommunicationIntent(
                senderName: callerName,
                senderUsername: payload.caller?.username ?? "",
                avatarData: avatarData,
                conversationId: payload.rid ?? "",
                isGroup: false,
                groupName: nil
            )
            
            self.contentHandler?(self.finalContent ?? bestAttemptContent)
        }
    }
    
    func processPayload(payload: Payload) {
        guard let bestAttemptContent = bestAttemptContent else { return }

        // 1. Setup Basic Content (Title/Body)
        let senderName = payload.sender?.name ?? payload.senderName ?? "Unknown"
        let senderUsername = payload.sender?.username ?? payload.senderName ?? ""
        
        bestAttemptContent.title = senderName
        
        if let roomType = payload.type {
            if roomType == .group || roomType == .channel {
                bestAttemptContent.title = payload.name ?? senderName
                // Strip sender prefix if present
                if let body = bestAttemptContent.body as String? {
                    let prefix = "\(senderUsername): "
                    if body.hasPrefix(prefix) {
                        bestAttemptContent.body = String(body.dropFirst(prefix.count))
                    } else {
                        // Try with sender name (display name) as fallback
                        let senderNamePrefix = "\(senderName): "
                        if body.hasPrefix(senderNamePrefix) {
                            bestAttemptContent.body = String(body.dropFirst(senderNamePrefix.count))
                        }
                    }
                }
            } else if roomType == .livechat {
                bestAttemptContent.title = payload.sender?.name ?? senderName
            }
        }
        
        // Handle Decryption (E2E)
        if payload.messageType == .e2e, let rid = payload.rid {
             if let decrypted = decryptMessage(payload: payload, rid: rid) {
                 bestAttemptContent.body = decrypted
             }
        }
        
        // 2. Fetch Avatar & Activate Intent
        fetchAvatarData(from: payload) { [weak self] avatarData in
            guard let self = self else { return }
            
            let isGroup = (payload.type == .group || payload.type == .channel)
            
            self.activateCommunicationIntent(
                senderName: senderName,
                senderUsername: senderUsername,
                avatarData: avatarData,
                conversationId: payload.rid ?? "",
                isGroup: isGroup,
                groupName: payload.name
            )
            
            self.contentHandler?(self.finalContent ?? bestAttemptContent)
        }
    }

    // MARK: - Shared Intent Logic
    
    /// Shared method to create INPerson, INSendMessageIntent, and update the notification
    private func activateCommunicationIntent(senderName: String, senderUsername: String, avatarData: Data?, conversationId: String, isGroup: Bool, groupName: String?) {
        guard let bestAttemptContent = bestAttemptContent else { return }

        // 1. Create Sender
        var senderImage: INImage? = nil
        if let data = avatarData {
            senderImage = INImage(imageData: data)
        }
        
        let sender = INPerson(
            personHandle: INPersonHandle(value: senderUsername, type: .unknown),
            nameComponents: nil,
            displayName: senderName,
            image: senderImage,
            contactIdentifier: nil,
            customIdentifier: nil
        )
        
        // 2. Handle Group Logic
        var recipients: [INPerson]? = nil
        var speakableGroupName: INSpeakableString? = nil
        
        if isGroup {
            speakableGroupName = (groupName != nil) ? INSpeakableString(spokenPhrase: groupName!) : nil
            // Dummy recipient required for iOS to treat as group conversation
            let dummy = INPerson(
                personHandle: INPersonHandle(value: "placeholder", type: .unknown),
                nameComponents: nil,
                displayName: nil,
                image: nil,
                contactIdentifier: nil,
                customIdentifier: "recipient_\(conversationId)"
            )
            recipients = [dummy]
        }
        
        // 3. Create Intent
        let intent = INSendMessageIntent(
            recipients: recipients,
            outgoingMessageType: .outgoingMessageText,
            content: bestAttemptContent.body,
            speakableGroupName: speakableGroupName,
            conversationIdentifier: conversationId,
            serviceName: nil,
            sender: sender,
            attachments: nil
        )
        
        if isGroup {
            intent.setImage(senderImage, forParameterNamed: \.speakableGroupName)
        }
        
        // 4. Donate & Update
        let interaction = INInteraction(intent: intent, response: nil)
        interaction.direction = .incoming
        interaction.donate(completion: nil)
        
        do {
            self.finalContent = try bestAttemptContent.updating(from: intent)
        } catch {
            self.finalContent = bestAttemptContent
        }
    }
    
    // MARK: - Helpers
    
    private func fetchMessageContent(payload: Payload) {
        UNUserNotificationCenter.current().getDeliveredNotifications { [weak self] deliveredNotifications in
            guard let self = self else { return }
            
            let identifiersToRemove = deliveredNotifications.filter {
                $0.request.content.body == "You have a new message"
            }.map { $0.request.identifier }
            
            if identifiersToRemove.count > 0 {
                UNUserNotificationCenter.current().removeDeliveredNotifications(withIdentifiers: identifiersToRemove)
            }
            
            // Request the content from server
            if let messageId = payload.messageId {
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
    
    private func decryptMessage(payload: Payload, rid: String) -> String? {
        if let content = payload.content, (content.algorithm == "rc.v1.aes-sha2" || content.algorithm == "rc.v2.aes-sha2") {
            return rocketchat?.decryptContent(rid: rid, content: content)
        } else if let msg = payload.msg, !msg.isEmpty {
            return rocketchat?.decryptContent(rid: rid, content: EncryptedContent(algorithm: "rc.v1.aes-sha2", ciphertext: msg, kid: nil, iv: nil))
        }
        return nil
    }

    // MARK: - Avatar Fetching
    
    /// Fetches avatar image data from a given avatar path
    private func fetchAvatarDataFromPath(avatarPath: String, server: String, credentials: Credentials, completion: @escaping (Data?) -> Void) {
        let fullPath = "\(avatarPath)?format=png&size=100&rc_token=\(credentials.userToken)&rc_uid=\(credentials.userId)"
        guard let avatarURL = URL(string: server + fullPath) else {
            completion(nil)
            return
        }
        
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
    
    /// Fetches avatar image data for video conference caller
    func fetchCallerAvatarData(from payload: Payload, completion: @escaping (Data?) -> Void) {
        let server = payload.host.removeTrailingSlash()
        guard let credentials = Storage().getCredentials(server: server),
              let username = payload.caller?.username,
              let encoded = username.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) else {
            completion(nil)
            return
        }
        fetchAvatarDataFromPath(avatarPath: "/avatar/\(encoded)", server: server, credentials: credentials, completion: completion)
    }

    /// Fetches avatar image data - sender's avatar for DMs, room avatar for groups/channels
    func fetchAvatarData(from payload: Payload, completion: @escaping (Data?) -> Void) {
        let server = payload.host.removeTrailingSlash()
        guard let credentials = Storage().getCredentials(server: server) else {
            completion(nil)
            return
        }
        
        let avatarPath: String
        if payload.type == .direct {
            guard let username = payload.sender?.username,
                  let encoded = username.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) else {
                completion(nil)
                return
            }
            avatarPath = "/avatar/\(encoded)"
        } else {
            guard let rid = payload.rid else {
                completion(nil)
                return
            }
            avatarPath = "/avatar/room/\(rid)"
        }
        
        fetchAvatarDataFromPath(avatarPath: avatarPath, server: server, credentials: credentials, completion: completion)
    }
}
