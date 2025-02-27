//
//  SSLPinning.m
//  RocketChatRN
//
//  Created by Diego Mello on 11/07/23.
//  Copyright © 2023 Facebook. All rights reserved.
//

#import <objc/runtime.h>
#import "SSLPinning.h"
#import <MMKV/MMKV.h>
#import <SDWebImage/SDWebImageDownloader.h>
#import "SecureStorage.h"
#import "SRWebSocket.h"
#import "EXSessionTaskDispatcher.h"

@implementation Challenge : NSObject
+(NSURLCredential *)getUrlCredential:(NSURLAuthenticationChallenge *)challenge path:(NSString *)path password:(NSString *)password
{
  NSString *authMethod = [[challenge protectionSpace] authenticationMethod];
  SecTrustRef serverTrust = challenge.protectionSpace.serverTrust;

  if ([authMethod isEqualToString:NSURLAuthenticationMethodServerTrust] || path == nil || password == nil) {
    return [NSURLCredential credentialForTrust:challenge.protectionSpace.serverTrust];
  } else if (path && password) {
    NSMutableArray *policies = [NSMutableArray array];
    [policies addObject:(__bridge_transfer id)SecPolicyCreateSSL(true, (__bridge CFStringRef)challenge.protectionSpace.host)];
    SecTrustSetPolicies(serverTrust, (__bridge CFArrayRef)policies);

    SecTrustResultType result;
    SecTrustEvaluate(serverTrust, &result);

    if (![[NSFileManager defaultManager] fileExistsAtPath:path])
    {
      return [NSURLCredential credentialForTrust:challenge.protectionSpace.serverTrust];
    }

    NSData *p12data = [NSData dataWithContentsOfFile:path];
    NSDictionary* options = @{ (id)kSecImportExportPassphrase:password };
    CFArrayRef rawItems = NULL;
    OSStatus status = SecPKCS12Import((__bridge CFDataRef)p12data,
                                      (__bridge CFDictionaryRef)options,
                                      &rawItems);

    if (status != noErr) {
      return [NSURLCredential credentialForTrust:challenge.protectionSpace.serverTrust];
    }

    NSArray* items = (NSArray*)CFBridgingRelease(rawItems);
    NSDictionary* firstItem = nil;
    if ((status == errSecSuccess) && ([items count]>0)) {
        firstItem = items[0];
    }

    SecIdentityRef identity = (SecIdentityRef)CFBridgingRetain(firstItem[(id)kSecImportItemIdentity]);
    SecCertificateRef certificate = NULL;
    if (identity) {
        SecIdentityCopyCertificate(identity, &certificate);
        if (certificate) { CFRelease(certificate); }
    }

    NSMutableArray *certificates = [[NSMutableArray alloc] init];
    [certificates addObject:CFBridgingRelease(certificate)];

    [SDWebImageDownloader sharedDownloader].config.urlCredential = [NSURLCredential credentialWithIdentity:identity certificates:certificates persistence:NSURLCredentialPersistenceNone];

    return [NSURLCredential credentialWithIdentity:identity certificates:certificates persistence:NSURLCredentialPersistenceNone];
  }

  return [NSURLCredential credentialForTrust:challenge.protectionSpace.serverTrust];
}

+(NSString *)stringToHex:(NSString *)string
{
  char *utf8 = (char *)[string UTF8String];
  NSMutableString *hex = [NSMutableString string];
  while (*utf8) [hex appendFormat:@"%02X", *utf8++ & 0x00FF];

  return [[NSString stringWithFormat:@"%@", hex] lowercaseString];
}

+(void)runChallenge:(NSURLSession *)session
 didReceiveChallenge:(NSURLAuthenticationChallenge *)challenge
  completionHandler:(void (^)(NSURLSessionAuthChallengeDisposition disposition, NSURLCredential *credential))completionHandler
{
  NSString *host = challenge.protectionSpace.host;

  // Read the clientSSL info from MMKV
  __block NSString *clientSSL;
  SecureStorage *secureStorage = [[SecureStorage alloc] init];

  // https://github.com/ammarahm-ed/react-native-mmkv-storage/blob/master/src/loader.js#L31
  NSString *key = [secureStorage getSecureKey:[self stringToHex:@"com.MMKV.default"]];
  NSURLCredential *credential = [NSURLCredential credentialForTrust:challenge.protectionSpace.serverTrust];

  if (key == NULL) {
    return completionHandler(NSURLSessionAuthChallengePerformDefaultHandling, credential);
  }

  NSData *cryptKey = [key dataUsingEncoding:NSUTF8StringEncoding];
  MMKV *mmkv = [MMKV mmkvWithID:@"default" cryptKey:cryptKey mode:MMKVMultiProcess];
  clientSSL = [mmkv getStringForKey:host];

  if (clientSSL) {
    NSData *data = [clientSSL dataUsingEncoding:NSUTF8StringEncoding];
    id dict = [NSJSONSerialization JSONObjectWithData:data options:0 error:nil];
    NSString *path = [dict objectForKey:@"path"];
    NSString *password = [dict objectForKey:@"password"];
    credential = [self getUrlCredential:challenge path:path password:password];
  }

  completionHandler(NSURLSessionAuthChallengeUseCredential, credential);
}
@end

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
  
    // Read the clientSSL info from MMKV
    NSMutableDictionary<NSString *, id> *SSLOptions = [NSMutableDictionary new];
    __block NSString *clientSSL;
    SecureStorage *secureStorage = [[SecureStorage alloc] init];

    // https://github.com/ammarahm-ed/react-native-mmkv-storage/blob/master/src/loader.js#L31
    NSString *key = [secureStorage getSecureKey:[Challenge stringToHex:@"com.MMKV.default"]];

    if (key != NULL) {
      NSData *cryptKey = [key dataUsingEncoding:NSUTF8StringEncoding];
      MMKV *mmkv = [MMKV mmkvWithID:@"default" cryptKey:cryptKey mode:MMKVMultiProcess];
      NSURLRequest *_urlRequest = [self valueForKey:@"_urlRequest"];

      clientSSL = [mmkv getStringForKey:_urlRequest.URL.host];
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
