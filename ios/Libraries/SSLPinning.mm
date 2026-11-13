//
//  SSLPinning.m
//  RocketChatRN
//
//  Created by Diego Mello on 11/07/23.
//  Copyright © 2023 Facebook. All rights reserved.
//

#import <objc/runtime.h>
#import "SSLPinning.h"
#import <SocketRocket/SRWebSocket.h>
#import <React/RCTWebSocketModule.h>
#import "EXSessionTaskDispatcher.h"
#import <SDWebImage/SDWebImageDownloader.h>
#if __has_include(<ExpoModulesCore/ExpoModulesCore-Swift.h>)
#import <ExpoModulesCore/ExpoModulesCore-Swift.h>
#else
#import "ExpoModulesCore-Swift.h"
#endif

@implementation RCTHTTPRequestHandler (Challenge)

- (void) URLSession:(NSURLSession *)session didReceiveChallenge:(NSURLAuthenticationChallenge *)challenge completionHandler:(void (^)(NSURLSessionAuthChallengeDisposition, NSURLCredential * _Nullable credential))completionHandler
{
  [Challenge runChallenge:session didReceiveChallenge:challenge completionHandler:completionHandler];
}

@end

@implementation EXSessionTaskDispatcher (Challenge)

- (void)URLSession:(NSURLSession *)session
                task:(NSURLSessionTask *)task
    didReceiveChallenge:(NSURLAuthenticationChallenge *)challenge
    completionHandler:(void (^)(NSURLSessionAuthChallengeDisposition disposition, NSURLCredential *credential))completionHandler
{
  [Challenge runChallenge:session didReceiveChallenge:challenge completionHandler:completionHandler];
}

@end

typedef void (*TaskChallengeIMP)(id, SEL, NSURLSession *, NSURLSessionTask *, NSURLAuthenticationChallenge *, void (^)(NSURLSessionAuthChallengeDisposition, NSURLCredential *));

static void hookClientCertificateChallenge(Class cls)
{
  SEL selector = @selector(URLSession:task:didReceiveChallenge:completionHandler:);
  Method method = class_getInstanceMethod(cls, selector);
  NSCAssert(method, @"%@ no longer handles auth challenges; client certificates will not be sent", cls);
  if (!method) {
    return;
  }
  TaskChallengeIMP original = (TaskChallengeIMP)method_getImplementation(method);
  IMP imp = imp_implementationWithBlock(^(id _self, NSURLSession *session, NSURLSessionTask *task, NSURLAuthenticationChallenge *challenge, void (^completionHandler)(NSURLSessionAuthChallengeDisposition, NSURLCredential *)) {
    NSURLCredential *credential = [Challenge clientCertificateCredential:challenge];
    if (credential) {
      completionHandler(NSURLSessionAuthChallengeUseCredential, credential);
      return;
    }
    original(_self, selector, session, task, challenge, completionHandler);
  });
  method_setImplementation(method, imp);
}

@interface ClientCertificateChallengeHooks : NSObject
@end

@implementation ClientCertificateChallengeHooks

+ (void)load
{
  hookClientCertificateChallenge([SDWebImageDownloader class]);
  hookClientCertificateChallenge([URLSessionSessionDelegateProxy class]);
}

@end

// SocketRocket negotiates TLS 1.2 at most, so its sockets cannot reach servers that only accept TLS 1.3.
// This subclass keeps the SRWebSocket interface React Native expects and runs the connection on NSURLSession.
@interface URLSessionWebSocket : SRWebSocket <NSURLSessionWebSocketDelegate>
@end

@implementation URLSessionWebSocket {
  NSURLRequest *_request;
  NSURLSession *_session;
  NSURLSessionWebSocketTask *_task;
  dispatch_queue_t _delegateQueue;
  SRReadyState _state;
  NSString *_negotiatedProtocol;
  NSInteger _closeCode;
  NSString *_closeReason;
}

+ (void)load
{
  RCTSetCustomSRWebSocketProvider(^SRWebSocket *(NSURLRequest *request) {
    return [[URLSessionWebSocket alloc] initWithURLRequest:request];
  });
}

- (instancetype)initWithURLRequest:(NSURLRequest *)request protocols:(NSArray<NSString *> *)protocols securityPolicy:(SRSecurityPolicy *)securityPolicy
{
  self = [super initWithURLRequest:request protocols:protocols securityPolicy:securityPolicy];
  if (self) {
    NSMutableURLRequest *mutableRequest = [request mutableCopy];
    if (protocols.count > 0) {
      [mutableRequest setValue:[protocols componentsJoinedByString:@", "] forHTTPHeaderField:@"Sec-WebSocket-Protocol"];
    }
    // SocketRocket always sends Origin, and some servers and proxies check it
    if (![mutableRequest valueForHTTPHeaderField:@"Origin"]) {
      [mutableRequest setValue:[URLSessionWebSocket originForURL:request.URL] forHTTPHeaderField:@"Origin"];
    }
    _request = mutableRequest;
    _delegateQueue = dispatch_get_main_queue();
    _state = SR_CONNECTING;
  }
  return self;
}

+ (NSString *)originForURL:(NSURL *)url
{
  NSString *scheme = url.scheme.lowercaseString;
  BOOL secure = [scheme isEqualToString:@"wss"] || [scheme isEqualToString:@"https"];
  NSMutableString *origin = [NSMutableString stringWithFormat:@"%@://%@", secure ? @"https" : @"http", url.host];
  NSInteger defaultPort = secure ? 443 : 80;
  if (url.port && url.port.integerValue != defaultPort) {
    [origin appendFormat:@":%@", url.port];
  }
  return origin;
}

- (void)setDelegateDispatchQueue:(dispatch_queue_t)queue
{
  [super setDelegateDispatchQueue:queue];
  _delegateQueue = queue ?: dispatch_get_main_queue();
}

- (SRReadyState)readyState
{
  return _state;
}

- (NSString *)protocol
{
  return _negotiatedProtocol;
}

- (void)open
{
  NSAssert(!_task, @"Cannot call -open on a socket more than once");
  // Session callbacks run on the delegate queue, so state is only touched there
  NSOperationQueue *queue = [NSOperationQueue mainQueue];
  if (_delegateQueue != dispatch_get_main_queue()) {
    queue = [[NSOperationQueue alloc] init];
    queue.maxConcurrentOperationCount = 1;
    queue.underlyingQueue = _delegateQueue;
  }
  _session = [NSURLSession sessionWithConfiguration:[NSURLSessionConfiguration ephemeralSessionConfiguration] delegate:self delegateQueue:queue];
  _task = [_session webSocketTaskWithRequest:_request];
  // SocketRocket has no message size limit; the task defaults to 1 MiB
  _task.maximumMessageSize = NSIntegerMax;
  [_task resume];
  [self receiveNextMessage];
}

- (void)receiveNextMessage
{
  __weak __typeof(self) weakSelf = self;
  [_task receiveMessageWithCompletionHandler:^(NSURLSessionWebSocketMessage *message, NSError *error) {
    __strong __typeof(weakSelf) strongSelf = weakSelf;
    if (!strongSelf || error) {
      // Failures are reported through URLSession:task:didCompleteWithError:
      return;
    }
    id payload = message.type == NSURLSessionWebSocketMessageTypeString ? message.string : message.data;
    [strongSelf.delegate webSocket:strongSelf didReceiveMessage:payload];
    [strongSelf receiveNextMessage];
  }];
}

- (BOOL)sendMessage:(NSURLSessionWebSocketMessage *)message error:(NSError **)error
{
  if (_state != SR_OPEN) {
    if (error) {
      *error = [NSError errorWithDomain:SRWebSocketErrorDomain code:2134 userInfo:@{ NSLocalizedDescriptionKey: @"Invalid State: Cannot call `send` until connection is open." }];
    }
    return NO;
  }
  [_task sendMessage:message completionHandler:^(NSError *sendError) {}];
  return YES;
}

- (BOOL)sendString:(NSString *)string error:(NSError **)error
{
  return [self sendMessage:[[NSURLSessionWebSocketMessage alloc] initWithString:string] error:error];
}

- (BOOL)sendData:(NSData *)data error:(NSError **)error
{
  return [self sendMessage:[[NSURLSessionWebSocketMessage alloc] initWithData:data ?: [NSData data]] error:error];
}

- (BOOL)sendDataNoCopy:(NSData *)data error:(NSError **)error
{
  return [self sendData:data error:error];
}

- (BOOL)sendPing:(NSData *)data error:(NSError **)error
{
  if (_state != SR_OPEN) {
    if (error) {
      *error = [NSError errorWithDomain:SRWebSocketErrorDomain code:2134 userInfo:@{ NSLocalizedDescriptionKey: @"Invalid State: Cannot call `sendPing` until connection is open." }];
    }
    return NO;
  }
  [_task sendPingWithPongReceiveHandler:^(NSError *pingError) {}];
  return YES;
}

- (void)close
{
  [self closeWithCode:SRStatusCodeNormal reason:nil];
}

- (void)closeWithCode:(NSInteger)code reason:(NSString *)reason
{
  if (_state == SR_CLOSING || _state == SR_CLOSED) {
    return;
  }
  _state = SR_CLOSING;
  _closeCode = code;
  _closeReason = reason;
  [_task cancelWithCloseCode:(NSURLSessionWebSocketCloseCode)code reason:[reason dataUsingEncoding:NSUTF8StringEncoding]];
}

- (void)didCloseWithCode:(NSInteger)code reason:(NSString *)reason wasClean:(BOOL)wasClean
{
  if (_state == SR_CLOSED) {
    return;
  }
  _state = SR_CLOSED;
  [_session finishTasksAndInvalidate];
  id<SRWebSocketDelegate> delegate = self.delegate;
  if ([delegate respondsToSelector:@selector(webSocket:didCloseWithCode:reason:wasClean:)]) {
    [delegate webSocket:self didCloseWithCode:code reason:reason wasClean:wasClean];
  }
}

#pragma mark - NSURLSessionWebSocketDelegate

- (void)URLSession:(NSURLSession *)session webSocketTask:(NSURLSessionWebSocketTask *)webSocketTask didOpenWithProtocol:(NSString *)protocol
{
  _negotiatedProtocol = protocol;
  _state = SR_OPEN;
  id<SRWebSocketDelegate> delegate = self.delegate;
  if ([delegate respondsToSelector:@selector(webSocketDidOpen:)]) {
    [delegate webSocketDidOpen:self];
  }
}

- (void)URLSession:(NSURLSession *)session webSocketTask:(NSURLSessionWebSocketTask *)webSocketTask didCloseWithCode:(NSURLSessionWebSocketCloseCode)closeCode reason:(NSData *)reason
{
  NSString *reasonString = reason ? [[NSString alloc] initWithData:reason encoding:NSUTF8StringEncoding] : nil;
  [self didCloseWithCode:closeCode reason:reasonString wasClean:YES];
}

- (void)URLSession:(NSURLSession *)session task:(NSURLSessionTask *)task didCompleteWithError:(NSError *)error
{
  if (_state == SR_CLOSED) {
    return;
  }
  if (_state == SR_CLOSING) {
    // We asked for the close, so report it the way it was requested
    [self didCloseWithCode:_closeCode reason:_closeReason wasClean:YES];
    return;
  }
  if (!error) {
    [self didCloseWithCode:SRStatusCodeAbnormal reason:nil wasClean:NO];
    return;
  }
  _state = SR_CLOSED;
  [_session finishTasksAndInvalidate];
  id<SRWebSocketDelegate> delegate = self.delegate;
  if ([delegate respondsToSelector:@selector(webSocket:didFailWithError:)]) {
    [delegate webSocket:self didFailWithError:error];
  }
}

- (void)URLSession:(NSURLSession *)session
                   task:(NSURLSessionTask *)task
    didReceiveChallenge:(NSURLAuthenticationChallenge *)challenge
      completionHandler:(void (^)(NSURLSessionAuthChallengeDisposition disposition, NSURLCredential *credential))completionHandler
{
  NSURLCredential *credential = [Challenge clientCertificateCredential:challenge];
  if (credential) {
    completionHandler(NSURLSessionAuthChallengeUseCredential, credential);
    return;
  }
  completionHandler(NSURLSessionAuthChallengePerformDefaultHandling, nil);
}

@end
