//
//  API.swift
//  NotificationService
//
//  Created by Djorkaeff Alexandre Vilela Pereira on 9/16/20.
//  Copyright © 2020 Rocket.Chat. All rights reserved.
//

import Foundation

final class API {
  typealias Server = String
  
  final let server: URL
  final let credentials: Credentials?
  final let decoder = JSONDecoder()
  
  static var instances: [Server: API] = [:]
  
  convenience init?(server: Server) {
    guard let server = URL(server: server) else {
      return nil
    }
    
    self.init(server: server)
  }
  
  init(server: URL) {
    self.server = server
    self.credentials = Storage.shared.getCredentials(server: server.absoluteString)
  }
  
  func fetch<T: Request>(request: T, completion: @escaping((T.ResponseType) -> Void)) {
    guard let request = request.request(for: self) else {
      return
    }
    
    let task = URLSession.shared.dataTask(with: request) {(data, _, error) in
      if let _ = error as NSError? {
        return
      }
      
      guard let data = data else {
        return
      }
      
      if let response = try? self.decoder.decode(T.ResponseType.self, from: data), response.success {
        completion(response)
      }
    }
    
    task.resume()
  }
}

