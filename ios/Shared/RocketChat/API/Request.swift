//
//  Request.swift
//  NotificationService
//
//  Created by Djorkaeff Alexandre Vilela Pereira on 9/16/20.
//  Copyright © 2020 Rocket.Chat. All rights reserved.
//

import Foundation

protocol Request {
  associatedtype ResponseType: Response
  
  var path: String { get }
  var method: HTTPMethod { get }
  var contentType: String { get }
  
  var query: String? { get }
  
  func body() -> Data?
  func request(for api: API) -> URLRequest?
}

extension Request {
  var method: HTTPMethod {
    return .get
  }
  
  var contentType: String {
    return "application/json"
  }
  
  var path: String {
    return ""
  }
  
  var query: String? {
    return nil
  }
  
  func body() -> Data? {
    return nil
  }
  
  func request(for api: API) -> URLRequest? {
    var components = URLComponents(url: api.server, resolvingAgainstBaseURL: false)
    components?.path += path
    components?.query = query
    
    guard let url = components?.url else {
      return nil
    }
    
    var request = URLRequest(url: url)
    request.httpMethod = method.rawValue
    request.httpBody = body()
    request.addValue(contentType, forHTTPHeaderField: "Content-Type")
    
    if let userId = api.credentials?.userId {
      request.addValue(userId, forHTTPHeaderField: "x-user-id")
    } else {
        return nil
    }
    if let userToken = api.credentials?.userToken {
      request.addValue(userToken, forHTTPHeaderField: "x-auth-token")
    } else {
        return nil
    }
    
    return request
  }
}
