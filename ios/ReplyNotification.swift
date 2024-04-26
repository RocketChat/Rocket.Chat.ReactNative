//
//  ReplyNotification.swift
//  RocketChatRN
//
//  Created by Djorkaeff Alexandre Vilela Pereira on 9/17/20.
//  Copyright © 2020 Rocket.Chat. All rights reserved.
//

import Foundation
import UserNotifications

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
          if let payload = try? JSONDecoder().decode(Payload.self, from: data), let rid = payload.rid {
            if let msg = (response as? UNTextInputNotificationResponse)?.userText {
              let rocketchat = RocketChat(server: payload.host.removeTrailingSlash())
              let backgroundTask = UIApplication.shared.beginBackgroundTask(expirationHandler: nil)
              rocketchat.sendMessage(rid: rid, message: msg, threadIdentifier: payload.tmid) { response in
                guard let response = response, response.success else {
                  let content = UNMutableNotificationContent()
                  content.body = "Failed to reply message."
                  let request = UNNotificationRequest(identifier: "replyFailure", content: content, trigger: nil)
                  UNUserNotificationCenter.current().add(request, withCompletionHandler: nil)
                  return
                }
                UIApplication.shared.endBackgroundTask(backgroundTask)
              }
            }
          }
        }
      }
    } else {
      let body = RNNotificationParser.parseNotificationResponse(response)
      RNEventEmitter.sendEvent(RNNotificationOpened, body: body)
    }
  }
}
