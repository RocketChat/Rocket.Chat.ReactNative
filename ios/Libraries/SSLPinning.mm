//
//  SSLPinning.m
//  RocketChatRN
//
//  Created by Diego Mello on 11/07/23.
//  Copyright © 2023 Facebook. All rights reserved.
//

#import <objc/runtime.h>
#import "SSLPinning.h"
#import "../Shared/RocketChat/MMKVBridge.h"
#import "SRWebSocket.h"
#import "EXSessionTaskDispatcher.h"

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

@implementation SRWebSocket (Challenge)

- (void)setClientSSL:(NSString *)path password:(NSString *)password options:(NSMutableDictionary *)options;
{
    if ([[NSFileManager defaultManager] fileExistsAtPath:path])
    {
      NSData *pkcs12data = [[NSData alloc] initWithContentsOfFile:path];
      NSDictionary* certOptions = @{ (id)kSecImportExportPassphrase:password };
      CFArrayRef keyref = NULL;
      OSStatus sanityChesk = SecPKCS12Import((__bridge CFDataRef)pkcs12data,
                                              (__bridge CFDictionaryRef)certOptions,
                                              &keyref);
      if (sanityChesk == noErr) {
        CFDictionaryRef identityDict = (CFDictionaryRef)CFArrayGetValueAtIndex(keyref, 0);
        SecIdentityRef identityRef = (SecIdentityRef)CFDictionaryGetValue(identityDict, kSecImportItemIdentity);
        SecCertificateRef cert = NULL;
        OSStatus status = SecIdentityCopyCertificate(identityRef, &cert);
        if (!status) {
          NSArray *certificates = [[NSArray alloc] initWithObjects:(__bridge id)identityRef, (__bridge id)cert, nil];
          [options setObject:certificates forKey:(NSString *)kCFStreamSSLCertificates];
        }
      }
    }
}

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
  
    // Read the clientSSL info from MMKV using MMKVBridge
    NSMutableDictionary<NSString *, id> *SSLOptions = [NSMutableDictionary new];
    
    MMKVBridge *mmkvBridge = [Challenge getMMKVInstance];
    
    if (mmkvBridge) {
      NSURLRequest *_urlRequest = [self valueForKey:@"_urlRequest"];
      NSString *host = _urlRequest.URL.host;
      NSString *clientSSL = [mmkvBridge stringForKey:host];
      
      if (clientSSL) {
        NSData *data = [clientSSL dataUsingEncoding:NSUTF8StringEncoding];
        id dict = [NSJSONSerialization JSONObjectWithData:data options:0 error:nil];
        NSString *path = [dict objectForKey:@"path"];
        NSString *password = [dict objectForKey:@"password"];
        [self setClientSSL:path password:password options:SSLOptions];
        if (SSLOptions) {
          id _outputStream = [self valueForKey:@"_outputStream"];
          [_outputStream setProperty:SSLOptions forKey:(__bridge id)kCFStreamPropertySSLSettings];
        }
      }
    }
}

@end
