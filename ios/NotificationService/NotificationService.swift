import CoreLocation
import UserNotifications

struct PushResponse: Decodable {
    let success: Bool
    let data: Data

    struct Data: Decodable {
        let notification: Notification

        struct Notification: Decodable {
            let notId: Int
            let title: String
            let text: String
            let payload: Payload

            struct Payload: Decodable, Encodable {
                let host: String
                let rid: String?
                let type: String?
                let sender: Sender?
                let messageId: String
                let notificationType: String?
                let name: String?

                struct Sender: Decodable, Encodable {
                    let _id: String
                    let username: String
                    let name: String
                }
            }
        }
    }
}

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
            guard let data = try? (JSONDecoder().decode(PushResponse.Data.Notification.Payload.self, from: ejson)) else {
              return
            }

            let notificationType = data.notificationType ?? ""
          
            // If the notification have the content at her payload, show it
            if notificationType != "message-id-only" {
                contentHandler(bestAttemptContent)
                return
            }
          
            let suiteName = Bundle.main.object(forInfoDictionaryKey: "AppGroup") as! String
            let userDefaults = UserDefaults(suiteName: suiteName)

            var server = data.host
            if (server.last == "/") {
                server.removeLast()
            }
            let msgId = data.messageId

            let userId = userDefaults?.string(forKey: "reactnativemeteor_usertoken-\(server)") ?? ""
            let token = userDefaults?.string(forKey: "reactnativemeteor_usertoken-\(userId)") ?? ""
          
            if userId.isEmpty || token.isEmpty {
                contentHandler(bestAttemptContent)
                return
            }

            var urlComponents = URLComponents(string: "\(server)/api/v1/push.get")!
            let queryItems = [URLQueryItem(name: "id", value: msgId)]
            urlComponents.queryItems = queryItems
            
            var request = URLRequest(url: urlComponents.url!)
            request.httpMethod = "GET"
            request.addValue(userId, forHTTPHeaderField: "x-user-id")
            request.addValue(token, forHTTPHeaderField: "x-auth-token")

            runRequest(request: request, bestAttemptContent: bestAttemptContent, contentHandler: contentHandler)
        }
    }
  
    func runRequest(request: URLRequest, bestAttemptContent: UNMutableNotificationContent, contentHandler: @escaping (UNNotificationContent) -> Void) {
        let task = URLSession.shared.dataTask(with: request) {(data, response, error) in

        func retryRequest() {
          // if we can try again
          if self.retryCount < self.retryTimeout.count {
            // Try again after X seconds
            DispatchQueue.main.asyncAfter(deadline: .now() + self.retryTimeout[self.retryCount], execute: {
              self.runRequest(request: request, bestAttemptContent: bestAttemptContent, contentHandler: contentHandler)
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
                    let push = try? (JSONDecoder().decode(PushResponse.self, from: data))
                    if let push = push {
                      if push.success {
                        bestAttemptContent.title = push.data.notification.title
                        bestAttemptContent.body = push.data.notification.text

                        let payload = try? (JSONEncoder().encode(push.data.notification.payload))
                        if let payload = payload {
                            bestAttemptContent.userInfo["ejson"] = String(data: payload, encoding: .utf8) ?? "{}"
                        }

                        // Show notification with the content modified
                        contentHandler(bestAttemptContent)
                        return
                      }
                    }
                }
                retryRequest()
            }
        }
      }

      task.resume()
    }
    
    override func serviceExtensionTimeWillExpire() {
        // Called just before the extension will be terminated by the system.
        // Use this as an opportunity to deliver your "best attempt" at modified content, otherwise the original push payload will be used.
        if let contentHandler = contentHandler, let bestAttemptContent =  bestAttemptContent {
            contentHandler(bestAttemptContent)
        }
    }

}
