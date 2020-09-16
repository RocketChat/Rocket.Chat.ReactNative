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
      
      guard let credentials = Storage.shared.getCredentials(server: server) else {
        return
      }
      
      var urlComponents = URLComponents(string: "\(server)/api/v1/push.get")!
      let queryItems = [URLQueryItem(name: "id", value: data.messageId)]
      urlComponents.queryItems = queryItems
      
      var request = URLRequest(url: urlComponents.url!)
      request.httpMethod = "GET"
      request.addValue(credentials.userId, forHTTPHeaderField: "x-user-id")
      request.addValue(credentials.userToken, forHTTPHeaderField: "x-auth-token")
      
      runRequest(server: server, request: request, contentHandler: contentHandler)
    }
  }
  
  func runRequest(server: String, request: URLRequest, contentHandler: @escaping (UNNotificationContent) -> Void) {
    let task = URLSession.shared.dataTask(with: request) {(data, response, error) in
      
      func retryRequest() {
        // if we can try again
        if self.retryCount < self.retryTimeout.count {
          // Try again after X seconds
          DispatchQueue.main.asyncAfter(deadline: .now() + self.retryTimeout[self.retryCount], execute: {
            self.runRequest(server: server, request: request, contentHandler: contentHandler)
            self.retryCount += 1
          })
        }
      }
      
      // If some error happened
      if error != nil {
        retryRequest()
        
        // Check if the request did successfully
      } else if let response = response as? HTTPURLResponse {
        // if it not was successfully
        if response.statusCode != 200 {
          retryRequest()
          
          // If the response status is 200
        } else {
          // Process data
          if let data = data {
            // Parse data of response
            if let push = try? (JSONDecoder().decode(PushResponse.self, from: data)), push.success {
              self.processNotification(notification: push.data.notification)
              return
            }
          }
          retryRequest()
        }
      }
    }
    
    task.resume()
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
