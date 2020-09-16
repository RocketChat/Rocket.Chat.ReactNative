//
//  API.swift
//  NotificationService
//
//  Created by Djorkaeff Alexandre Vilela Pereira on 9/16/20.
//  Copyright © 2020 Facebook. All rights reserved.
//

import Foundation

final class API {
  typealias Server = String
  
  final let server: Server
  final let credentials: Credentials?
  final let decoder = JSONDecoder()
  
  static var instances: [Server: API] = [:]
  
  init(server: Server) {
    self.server = server
    self.credentials = Storage.shared.getCredentials(server: server)
  }
  
  func fetch<T: Response>(request: URLRequest, completion: @escaping((T) -> Void)) {
    var mutableRequest = request
    
    if let userId = credentials?.userId {
      mutableRequest.addValue(userId, forHTTPHeaderField: "x-user-id")
    }
    if let userToken = credentials?.userToken {
      mutableRequest.addValue(userToken, forHTTPHeaderField: "x-auth-token")
    }

    let task = URLSession.shared.dataTask(with: mutableRequest) {(data, _, error) in
      if let _ = error as NSError? {
        return
      }
      
      guard let data = data else {
        return
      }
      
      if let response = try? self.decoder.decode(T.self, from: data), response.success {
        completion(response)
      }
    }
    
    task.resume()
  }
}

