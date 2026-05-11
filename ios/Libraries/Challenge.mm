//
//  Challenge.mm
//  RocketChatRN
//
//  Extracted from SSLPinning.mm so the `Challenge` class can be compiled into the
//  NotificationService app extension (which must not pull in the
//  RCTHTTPRequestHandler/EXSessionTaskDispatcher/SRWebSocket categories).
//

#import "Challenge.h"
#import "../Shared/RocketChat/MMKVBridge.h"
#import <SDWebImage/SDWebImageDownloader.h>
#import "SecureStorage.h"

@interface Challenge ()
+ (NSString *)stringToHex:(NSString *)string;
+ (NSURLCredential *)getUrlCredential:(NSURLAuthenticationChallenge *)challenge path:(NSString *)path password:(NSString *)password;
@end

@implementation Challenge

+ (MMKVBridge *)getMMKVInstance {
  SecureStorage *secureStorage = [[SecureStorage alloc] init];
  NSString *hexKey = [self stringToHex:@"com.MMKV.default"];
  NSString *key = [secureStorage getSecureKey:hexKey];

  NSData *cryptKey = (key && [key length] > 0) ? [key dataUsingEncoding:NSUTF8StringEncoding] : nil;
  MMKVBridge *mmkvBridge = [[MMKVBridge alloc] initWithID:@"default" cryptKey:cryptKey rootPath:nil];

  return mmkvBridge;
}

+ (NSURLCredential *)getUrlCredential:(NSURLAuthenticationChallenge *)challenge path:(NSString *)path password:(NSString *)password
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

+ (NSString *)stringToHex:(NSString *)string
{
  char *utf8 = (char *)[string UTF8String];
  NSMutableString *hex = [NSMutableString string];
  while (*utf8) [hex appendFormat:@"%02X", *utf8++ & 0x00FF];

  return [[NSString stringWithFormat:@"%@", hex] lowercaseString];
}

+ (void)runChallenge:(NSURLSession *)session
 didReceiveChallenge:(NSURLAuthenticationChallenge *)challenge
  completionHandler:(void (^)(NSURLSessionAuthChallengeDisposition disposition, NSURLCredential *credential))completionHandler
{
  NSString *host = challenge.protectionSpace.host;
  NSURLCredential *credential = [NSURLCredential credentialForTrust:challenge.protectionSpace.serverTrust];

  MMKVBridge *mmkvBridge = [self getMMKVInstance];

  if (!mmkvBridge) {
    return completionHandler(NSURLSessionAuthChallengePerformDefaultHandling, credential);
  }

  NSString *clientSSL = [mmkvBridge stringForKey:host];

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
