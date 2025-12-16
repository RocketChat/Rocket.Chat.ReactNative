//
//  ReplyNotification.swift
//  RocketChatRN
//
//  Created by Djorkaeff Alexandre Vilela Pereira on 9/17/20.
//  Copyright © 2020 Rocket.Chat. All rights reserved.
//

import Foundation
import UserNotifications

// Handles direct reply from iOS notifications.
// Intercepts REPLY_ACTION responses and sends messages natively,
// while forwarding all other notification events to expo-notifications.
@objc(ReplyNotification)
class ReplyNotification: NSObject, UNUserNotificationCenterDelegate {
  private static var shared: ReplyNotification?
  private weak var originalDelegate: UNUserNotificationCenterDelegate?
  
  @objc
  public static func configure() {
    let instance = ReplyNotification()
    shared = instance
    
    // Store the original delegate (expo-notifications) and set ourselves as the delegate
    let center = UNUserNotificationCenter.current()
    instance.originalDelegate = center.delegate
    center.delegate = instance
  }
  
  // MARK: - UNUserNotificationCenterDelegate
  
  func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    didReceive response: UNNotificationResponse,
    withCompletionHandler completionHandler: @escaping () -> Void
  ) {
    // Handle REPLY_ACTION natively
    if response.actionIdentifier == "REPLY_ACTION" {
      handleReplyAction(response: response, completionHandler: completionHandler)
      return
    }
    
    // Forward to original delegate (expo-notifications)
    if let originalDelegate = originalDelegate {
      originalDelegate.userNotificationCenter?(center, didReceive: response, withCompletionHandler: completionHandler)
    } else {
      completionHandler()
    }
  }
  
  func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    willPresent notification: UNNotification,
    withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
  ) {
    // Forward to original delegate (expo-notifications)
    if let originalDelegate = originalDelegate {
      originalDelegate.userNotificationCenter?(center, willPresent: notification, withCompletionHandler: completionHandler)
    } else {
      completionHandler([])
    }
  }
  
  func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    openSettingsFor notification: UNNotification?
  ) {
    // Forward to original delegate (expo-notifications)
    if let originalDelegate = originalDelegate {
      if #available(iOS 12.0, *) {
        originalDelegate.userNotificationCenter?(center, openSettingsFor: notification)
      }
    }
  }
  
  // MARK: - Reply Handling
  
  private func handleReplyAction(response: UNNotificationResponse, completionHandler: @escaping () -> Void) {
    guard let textResponse = response as? UNTextInputNotificationResponse else {
      completionHandler()
      return
    }
    
    let userInfo = response.notification.request.content.userInfo
    
    guard let ejsonString = userInfo["ejson"] as? String,
          let ejsonData = ejsonString.data(using: .utf8),
          let payload = try? JSONDecoder().decode(Payload.self, from: ejsonData),
          let rid = payload.rid else {
      completionHandler()
      return
    }
    
    let message = textResponse.userText
    let rocketchat = RocketChat(server: payload.host.removeTrailingSlash())
    
    var backgroundTask: UIBackgroundTaskIdentifier = .invalid
    backgroundTask = UIApplication.shared.beginBackgroundTask {
      // Expiration handler - called if system needs to reclaim resources
      if backgroundTask != .invalid {
        UIApplication.shared.endBackgroundTask(backgroundTask)
        backgroundTask = .invalid
      }
    }
    
    rocketchat.sendMessage(rid: rid, message: message, threadIdentifier: payload.tmid) { response in
      // Ensure we're on the main thread for UI operations
      DispatchQueue.main.async {
        defer {
          if backgroundTask != .invalid {
            UIApplication.shared.endBackgroundTask(backgroundTask)
            backgroundTask = .invalid
          }
          completionHandler()
        }
        
        guard let response = response, response.success else {
          // Show failure notification
          let content = UNMutableNotificationContent()
          content.body = "Failed to reply message."
          let request = UNNotificationRequest(identifier: "replyFailure", content: content, trigger: nil)
          UNUserNotificationCenter.current().add(request, withCompletionHandler: nil)
          return
        }
      }
    }
  }
}
