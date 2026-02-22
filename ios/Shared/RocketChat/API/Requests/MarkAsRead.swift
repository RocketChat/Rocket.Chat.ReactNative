//
//  MarkAsRead.swift
//  RocketChatRN
//
//  Created for Mark as Read notification action
//  Copyright © 2025 Rocket.Chat. All rights reserved.
//

import Foundation

struct MarkAsReadBody: Codable {
    let rid: String
}

struct MarkAsReadResponse: Response {
    var success: Bool
}

final class MarkAsReadRequest: Request {
    typealias ResponseType = MarkAsReadResponse
    
    let method: HTTPMethod = .post
    let path = "/api/v1/subscriptions.read"
    
    let rid: String
    
    init(rid: String) {
        self.rid = rid
    }
    
    func body() -> Data? {
        return try? JSONEncoder().encode(MarkAsReadBody(rid: rid))
    }
}
