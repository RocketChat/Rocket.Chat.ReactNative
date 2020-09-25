//
//  Storage.swift
//  NotificationService
//
//  Created by Djorkaeff Alexandre Vilela Pereira on 9/15/20.
//  Copyright © 2020 Rocket.Chat. All rights reserved.
//

import Foundation

struct Credentials {
  let userId: String
  let userToken: String
}

class Storage {
  static let shared = Storage()

  final var mmkv: MMKV? = nil

  init() {
    let mmapID = "default"
    let instanceID = "com.MMKV.\(mmapID)"
    let secureStorage = SecureStorage()

    // get mmkv instance password from keychain
    var key: Data?
    secureStorage.getSecureKey(instanceID.toHex()) { (response) -> () in
      if let password = response?[1] as? String {
        key = password.data(using: .utf8)
      }
    }
    
    guard let cryptKey = key else {
      return
    }
    
    // Get App Group directory
    let suiteName = Bundle.main.object(forInfoDictionaryKey: "AppGroup") as! String
    guard let directory = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: suiteName) else {
      return
    }
    
    // Set App Group dir
    MMKV.initialize(rootDir: nil, groupDir: directory.path, logLevel: MMKVLogLevel.none)
    self.mmkv = MMKV(mmapID: mmapID, cryptKey: cryptKey, mode: MMKVMode.multiProcess)
  }
  
  func getCredentials(server: String) -> Credentials? {
    if let userId = self.mmkv?.string(forKey: "reactnativemeteor_usertoken-\(server)") {
      if let userToken = self.mmkv?.string(forKey: "reactnativemeteor_usertoken-\(userId)") {
        return Credentials(userId: userId, userToken: userToken)
      }
    }
    
    return nil
  }
  
  func getPrivateKey(server: String) -> String? {
    return self.mmkv?.string(forKey: "\(server)-RC_E2E_PRIVATE_KEY")
  }
}
