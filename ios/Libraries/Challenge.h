//
//  Challenge.h
//  RocketChatRN
//
//  Shared TLS / client-certificate handling used by React Native networking and native URLSessions.
//  Extracted from SSLPinning.h so app extensions (NotificationService) can use `Challenge` without
//  pulling in the RCTHTTPRequestHandler/EXSessionTaskDispatcher/SRWebSocket categories.
//

#import <Foundation/NSURLSession.h>

@class MMKVBridge;

NS_ASSUME_NONNULL_BEGIN

@interface Challenge : NSObject
+ (void)runChallenge:(NSURLSession *)session
 didReceiveChallenge:(NSURLAuthenticationChallenge *)challenge
  completionHandler:(void (^)(NSURLSessionAuthChallengeDisposition disposition, NSURLCredential * _Nullable credential))completionHandler
  NS_SWIFT_NAME(runChallenge(_:didReceiveChallenge:completionHandler:));
+ (MMKVBridge *)getMMKVInstance NS_SWIFT_UNAVAILABLE("ObjC-only helper");
@end

NS_ASSUME_NONNULL_END
