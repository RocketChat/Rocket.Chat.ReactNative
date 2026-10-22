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

static void sendClientCertificate(Class cls)
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

@implementation URLSessionSessionDelegateProxy (Challenge)

+ (void)load
{
  sendClientCertificate(self);
}

@end

@implementation SDWebImageDownloader (Challenge)

+ (void)load
{
  sendClientCertificate(self);
}

@end

@implementation SRWebSocket (Challenge)

+(void)load
{
    Method original, swizzled;

    original = class_getInstanceMethod(objc_getClass("SRWebSocket"), @selector(_updateSecureStreamOptions));
    swizzled = class_getInstanceMethod(self, @selector(xxx_updateSecureStreamOptions));
    method_exchangeImplementations(original, swizzled);
}

#pragma mark - Method Swizzling
                
- (void)xxx_updateSecureStreamOptions {
    [self xxx_updateSecureStreamOptions];

    NSURLRequest *_urlRequest = [self valueForKey:@"_urlRequest"];
    NSURLCredential *credential = [Challenge clientCertificateCredentialForHost:_urlRequest.URL.host];
    if (!credential) {
      return;
    }
    NSArray *certificates = [@[(__bridge id)credential.identity] arrayByAddingObjectsFromArray:credential.certificates ?: @[]];
    id _outputStream = [self valueForKey:@"_outputStream"];
    [_outputStream setProperty:@{ (NSString *)kCFStreamSSLCertificates: certificates } forKey:(__bridge id)kCFStreamPropertySSLSettings];
}

@end
