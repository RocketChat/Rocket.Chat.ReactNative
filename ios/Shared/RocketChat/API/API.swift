//
//  API.swift
//  NotificationService
//
//  Created by Djorkaeff Alexandre Vilela Pereira on 9/16/20.
//  Copyright © 2020 Rocket.Chat. All rights reserved.
//

import Foundation

struct Retry {
  let retries: Int
  let retryTimeout = [10.0, 5.0, 3.0, 1.0]
  
  init(retries: Int) {
    if retries < 0 {
      self.retries = 0
    } else if retries > retryTimeout.count {
      self.retries = retryTimeout.count
    } else {
      self.retries = retries
    }
  }
  
  var timeout: Double {
    return retryTimeout[retries - 1]
  }
}

final class API {
  typealias Server = String
  
  final let server: URL
  final let credentials: Credentials?
  final let decoder = JSONDecoder()
  
  convenience init?(server: Server) {
    guard let server = URL(string: server.removeTrailingSlash()) else {
      return nil
    }

    guard let credentials = Storage().getCredentials(server: server.absoluteString) else {
      return nil
    }
    
    self.init(server: server, credentials: credentials)
  }
  
  init(server: URL, credentials: Credentials) {
    self.server = server
    self.credentials = credentials
  }
  
  func fetch<T: Request>(request: T, retry: Retry? = nil, completion: @escaping((APIResponse<T.ResponseType>) -> Void)) {
    func onError() {
      if let retry = retry, retry.retries > 0 {
        DispatchQueue.main.asyncAfter(deadline: .now() + retry.timeout, execute: {
          self.fetch(request: request, retry: Retry(retries: retry.retries - 1), completion: completion)
        })
        return
      }
      
      completion(.error)
    }

    guard let request = request.request(for: self) else {
      completion(.error)
      return
    }
    
    let task = URLSession.shared.dataTask(with: request) {(data, _, error) in
      if let _ = error as NSError? {
        onError()
        return
      }
      
      guard let data = data else {
        onError()
        return
      }
      
      if let response = try? self.decoder.decode(T.ResponseType.self, from: data), response.success {
        completion(.resource(response))
        return
      }
      
      onError()
    }
    
    task.resume()
  }
}

