//
//  MediaCallsAnswerRequest.swift
//  RocketChat
//
//  Created by Diego Mello on 4/10/26.
//

import Foundation

struct MediaCallsAnswerRequest: Request {
    typealias ResponseType = MediaCallsAnswerResponse

    let callId: String
    let contractId: String
    let answer: String
    let supportedFeatures: [String]?

    let method: HTTPMethod = .post
    let path = "/api/v1/media-calls.answer"

    init(callId: String, contractId: String, answer: String, supportedFeatures: [String]? = nil) {
        self.callId = callId
        self.contractId = contractId
        self.answer = answer
        self.supportedFeatures = supportedFeatures
    }

    func body() -> Data? {
        var dict: [String: Any] = [
            "callId": callId,
            "contractId": contractId,
            "answer": answer
        ]
        if let features = supportedFeatures {
            dict["supportedFeatures"] = features
        }
        return try? JSONSerialization.data(withJSONObject: dict)
    }
}

struct MediaCallsAnswerResponse: Response {
    let success: Bool
}
