import CoreLocation
import UserNotifications

class NotificationService: UNNotificationServiceExtension {

    var contentHandler: ((UNNotificationContent) -> Void)?
    var bestAttemptContent: UNMutableNotificationContent?

    override func didReceive(_ request: UNNotificationRequest, withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void) {
        self.contentHandler = contentHandler
        bestAttemptContent = (request.content.mutableCopy() as? UNMutableNotificationContent)
        
        if let bestAttemptContent = bestAttemptContent {
            let suiteName = Bundle.main.object(forInfoDictionaryKey: "AppGroup") as! String
            let userDefaults = UserDefaults(suiteName: suiteName)

            let ejson = bestAttemptContent.userInfo["ejson"] as! String
          
            if let data = ejson.data(using: .utf8) {
              let json = try? (JSONSerialization.jsonObject(with: data) as! [String: Any])
              if let json = json {
                  let host = json["host"] as! String
                  let msgId = json["messageId"] as! String
                  
                  let userId = userDefaults?.string(forKey: "reactnativemeteor_usertoken-\(host)")! ?? ""
                  let token = userDefaults?.string(forKey: "reactnativemeteor_usertoken-\(userId)")! ?? ""

                  var urlComponents = URLComponents(string: "\(host)/api/v1/chat.getMessage")!
                  let queryItems = [URLQueryItem(name: "msgId", value: msgId)]
                  urlComponents.queryItems = queryItems
                  
                  var request = URLRequest(url: urlComponents.url!)
                  request.httpMethod = "GET"
                  request.addValue(userId, forHTTPHeaderField: "x-user-id")
                  request.addValue(token, forHTTPHeaderField: "x-auth-token")

                  let task = URLSession.shared.dataTask(with: request) {(data, response, error) in
                      guard let data = data else { return }
                      let json = try? (JSONSerialization.jsonObject(with: data) as! [String: Any])
                      if let json = json {
                        if let content = json["message"] as? [String: Any] {
                            bestAttemptContent.body = content["msg"] as! String
                          
                            if let user = content["u"] as? [String: Any] {
                                bestAttemptContent.title = user["username"] as! String
                            }
                        }
                      }
                      contentHandler(bestAttemptContent)
                  }

                  task.resume()
              }
            }
        }
    }
    
    override func serviceExtensionTimeWillExpire() {
        // Called just before the extension will be terminated by the system.
        // Use this as an opportunity to deliver your "best attempt" at modified content, otherwise the original push payload will be used.
        if let contentHandler = contentHandler, let bestAttemptContent =  bestAttemptContent {
            contentHandler(bestAttemptContent)
        }
    }

}
