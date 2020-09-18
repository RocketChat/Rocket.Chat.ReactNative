//
//  ReplyNotification.swift
//  RocketChatRN
//
//  Created by Djorkaeff Alexandre Vilela Pereira on 9/17/20.
//  Copyright © 2020 Rocket.Chat. All rights reserved.
//

import Foundation
import UserNotifications

struct Ejson: Decodable {
  let host: String
  let rid: String?
}

struct MessageBody: Encodable {
  let message: Message
  
  struct Message: Encodable {
    let _id: String
    let msg: String
    let rid: String
  }
}

struct Response: Decodable {
  let success: Bool
}

extension String {
  static func random(length: Int) -> String {
    let letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    return String((0..<length).map{ _ in letters.randomElement()! })
  }
}

@objc(ReplyNotification)
class ReplyNotification: RNNotificationEventHandler {
  private static let dispatchOnce: Void = {
    let instance: AnyClass! = object_getClass(ReplyNotification())
    let originalMethod = class_getInstanceMethod(instance, #selector(didReceive))
    let swizzledMethod = class_getInstanceMethod(instance, #selector(replyNotification_didReceiveNotificationResponse))
    if let originalMethod = originalMethod, let swizzledMethod = swizzledMethod {
      method_exchangeImplementations(originalMethod, swizzledMethod)
    }
  }()
  
  @objc
  public static func configure() {
    _ = self.dispatchOnce
  }
  
  @objc
  func replyNotification_didReceiveNotificationResponse(_ response: UNNotificationResponse, completionHandler: @escaping(() -> Void)) {
    if response.actionIdentifier == "REPLY_ACTION" {
      if let notification = RCTConvert.unNotificationPayload(response.notification) {
        if let data = (notification["ejson"] as? String)?.data(using: .utf8) {
          if let ejson = try? JSONDecoder().decode(Ejson.self, from: data), let rid = ejson.rid {
            if let msg = (response as? UNTextInputNotificationResponse)?.userText {
              var server = ejson.host
              if server.last == "/" {
                server.removeLast()
              }
              
              var components = URLComponents(url: URL(string: server)!, resolvingAgainstBaseURL: false)
              components?.path += "/api/v1/chat.sendMessage"
              
              guard let url = components?.url else {
                return
              }
              
              let id = String.random(length: 17)
              let body = MessageBody(message: MessageBody.Message(_id: id, msg: msg, rid: rid))
              
              var request = URLRequest(url: url)
              request.httpMethod = "POST"
              request.httpBody = try? JSONEncoder().encode(body)
              
              let credentials = Storage.shared.getCredentials(server: server)
              if let userId = credentials?.userId {
                request.addValue(userId, forHTTPHeaderField: "x-user-id")
              }
              if let userToken = credentials?.userToken {
                request.addValue(userToken, forHTTPHeaderField: "x-auth-token")
              }
              request.addValue("application/json", forHTTPHeaderField: "Content-Type")
              
              let backgroundTask = UIApplication.shared.beginBackgroundTask(expirationHandler: nil)
              let task = URLSession.shared.dataTask(with: request) {(data, _, error) in
                func replyFailure() {
                  let content = UNMutableNotificationContent()
                  content.body = "Failed to reply message."
                  let request = UNNotificationRequest(identifier: "replyFailure", content: content, trigger: nil)
                  UNUserNotificationCenter.current().add(request, withCompletionHandler: nil)
                }
                
                if let _ = error {
                  replyFailure()
                  return
                }
                
                guard let data = data else {
                  replyFailure()
                  return
                }
                
                guard let response = try? (JSONDecoder().decode(Response.self, from: data)), response.success else {
                  replyFailure()
                  return
                }
                
                UIApplication.shared.endBackgroundTask(backgroundTask)
              }
              
              task.resume()
            }
          }
        }
      }
    }
  }
}
