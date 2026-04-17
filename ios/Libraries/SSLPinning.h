//
//  SSLPinning.h
//  RocketChatRN
//
//  Created by Diego Mello on 11/07/23.
//  Copyright © 2023 Facebook. All rights reserved.
//

#import <React/RCTHTTPRequestHandler.h>

NS_ASSUME_NONNULL_BEGIN

@class NSURLSession;
@class NSURLAuthenticationChallenge;

/// Shared TLS / client-certificate handling used by React Native networking and native URLSessions.
@interface Challenge : NSObject
+ (void)runChallenge:(NSURLSession *)session
 didReceiveChallenge:(NSURLAuthenticationChallenge *)challenge
  completionHandler:(void (^)(NSURLSessionAuthChallengeDisposition disposition, NSURLCredential * _Nullable credential))completionHandler;
@end

@interface RCTHTTPRequestHandler (Challenge)

@end

NS_ASSUME_NONNULL_END