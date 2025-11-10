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

static os_log_t SSLLog(void) {
  static os_log_t sLog;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    sLog = os_log_create("chat.rocket.ssl", "authentication");
  });
  return sLog;
}

@implementation Challenge : NSObject

+(NSString *)stringToHex:(NSString *)string
{
  char *utf8 = (char *)[string UTF8String];
  NSMutableString *hex = [NSMutableString string];
  while (*utf8) [hex appendFormat:@"%02X", *utf8++ & 0x00FF];

  return [[NSString stringWithFormat:@"%@", hex] lowercaseString];
}

+ (NSURLCredential *)getUrlCredential:(NSURLAuthenticationChallenge *)challenge path:(NSString *)path password:(NSString *)password {
  os_log_t sslLog = SSLLog();

  NSString *authMethod = challenge.protectionSpace.authenticationMethod;
  if (![authMethod isEqualToString:NSURLAuthenticationMethodClientCertificate]) {
    os_log_info(sslLog, "Not a client-certificate challenge");
    return nil;
  }

  if (path.length == 0 || password.length == 0) {
    os_log_info(sslLog, "No path/password configured for client cert");
    return nil;
  }

  if (![[NSFileManager defaultManager] fileExistsAtPath:path]) {
    os_log_error(sslLog, "Client cert file not found at path: %{private}@", path);
    return nil;
  }

  NSData *p12data = [NSData dataWithContentsOfFile:path];
  if (!p12data) {
    os_log_error(sslLog, "Failed to read PKCS12 data");
    return nil;
  }

  NSDictionary *options = @{ (id)kSecImportExportPassphrase : password };
  CFArrayRef rawItems = NULL;
  OSStatus status = SecPKCS12Import((__bridge CFDataRef)p12data,
                                    (__bridge CFDictionaryRef)options,
                                    &rawItems);
  if (status != errSecSuccess || rawItems == NULL) {
    os_log_error(sslLog, "SecPKCS12Import failed: %d", (int)status);
    if (rawItems) CFRelease(rawItems);
    return nil;
  }

  NSArray *items = (__bridge_transfer NSArray *)rawItems;
  if (items.count == 0) {
    os_log_error(sslLog, "PKCS12 import returned zero items");
    return nil;
  }

  NSDictionary *firstItem = items[0];
  id identityObj = firstItem[(id)kSecImportItemIdentity];
  if (!identityObj) {
    os_log_error(sslLog, "No identity found in PKCS12");
    return nil;
  }

  SecIdentityRef identity = (__bridge SecIdentityRef)identityObj;
  // Copy certificate from identity
  SecCertificateRef certificate = NULL;
  OSStatus certStatus = SecIdentityCopyCertificate(identity, &certificate);
  if (certStatus != errSecSuccess || certificate == NULL) {
    os_log_error(sslLog, "SecIdentityCopyCertificate failed: %d", (int)certStatus);
    if (certificate) CFRelease(certificate);
    return nil;
  }

  // Build NSArray of certificates (the array should contain certificates, not the identity).
  // Some APIs accept an array starting with identity, but NSURLCredential expects
  // an array of SecCertificateRef objects (chain). We'll pass the certificate we copied.
  id certObj = (__bridge_transfer id)certificate; // certificate will be released by ARC
  NSArray *certs = certObj ? @[certObj] : @[];

  // Create credential. Choose persistence according to desired policy.
  // Use NSURLCredentialPersistenceNone for one-off, or ForSession if you want reuse within a session.
  NSURLCredential *cred = [NSURLCredential credentialWithIdentity:identity
                                                     certificates:certs
                                                      persistence:NSURLCredentialPersistenceNone];

  os_log_info(sslLog, "Created client credential (certs: %lu)", (unsigned long)certs.count);
  return cred;
}

+ (void)runChallenge:(NSURLSession *)session
   didReceiveChallenge:(NSURLAuthenticationChallenge *)challenge
    completionHandler:(void (^)(NSURLSessionAuthChallengeDisposition disposition, NSURLCredential *credential))completionHandler
{
  os_log_t sslLog = SSLLog();
  static NSInteger seq = 0; seq++;
  NSString *host = challenge.protectionSpace.host ?: @"(unknown)";
  NSString *authMethod = challenge.protectionSpace.authenticationMethod ?: @"(none)";

  os_log_info(sslLog, "Challenge #%ld host=%{public}@ authMethod=%{public}@", (long)seq, host, authMethod);

  if ([authMethod isEqualToString:NSURLAuthenticationMethodClientCertificate]) {
    // Read stored client config (your existing MMKV code) — if not found, perform default handling.
    SecureStorage *secureStorage = [[SecureStorage alloc] init];
    NSString *key = [secureStorage getSecureKey:[self stringToHex:@"com.MMKV.default"]];
    if (key == nil) {
      os_log_info(sslLog, "No secure storage key -> default handling");
      completionHandler(NSURLSessionAuthChallengePerformDefaultHandling, nil);
      return;
    }

    NSData *cryptKey = [key dataUsingEncoding:NSUTF8StringEncoding];
    MMKV *mmkv = [MMKV mmkvWithID:@"default" cryptKey:cryptKey mode:MMKVMultiProcess];
    NSString *clientSSL = [mmkv getStringForKey:host];

    if (!clientSSL) {
      os_log_info(sslLog, "No client SSL configuration for host %{public}@", host);
      completionHandler(NSURLSessionAuthChallengePerformDefaultHandling, nil);
      return;
    }

    NSData *jsonData = [clientSSL dataUsingEncoding:NSUTF8StringEncoding];
    NSError *jsonErr = nil;
    NSDictionary *dict = [NSJSONSerialization JSONObjectWithData:jsonData options:0 error:&jsonErr];
    if (jsonErr || ![dict isKindOfClass:[NSDictionary class]]) {
      os_log_error(sslLog, "Malformed clientSSL JSON for host %{public}@: %{public}@", host, jsonErr.localizedDescription);
      completionHandler(NSURLSessionAuthChallengePerformDefaultHandling, nil);
      return;
    }

    NSString *path = dict[@"path"];
    NSString *password = dict[@"password"];
    if (!path || !password) {
      os_log_error(sslLog, "clientSSL entry missing path/password");
      completionHandler(NSURLSessionAuthChallengePerformDefaultHandling, nil);
      return;
    }

    NSURLCredential *clientCred = [self getUrlCredential:challenge path:path password:password];
    if (clientCred) {
      os_log_info(sslLog, "Presenting client certificate for host %{public}@", host);
      completionHandler(NSURLSessionAuthChallengeUseCredential, clientCred);
      return;
    } else {
      os_log_error(sslLog, "Failed to build client credential - default handling");
      completionHandler(NSURLSessionAuthChallengePerformDefaultHandling, nil);
      return;
    }
  }

  // For all other auth methods, allow system default handling:
  completionHandler(NSURLSessionAuthChallengePerformDefaultHandling, nil);
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
