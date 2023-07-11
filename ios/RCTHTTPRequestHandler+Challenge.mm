//
//  RCTHTTPRequestHandler+Challenge.m
//  RocketChatRN
//
//  Created by Diego Mello on 11/07/23.
//  Copyright © 2023 Facebook. All rights reserved.
//

#import "RCTHTTPRequestHandler+Challenge.h"
#import "RNFetchBlobRequest.h"
#import <MMKV/MMKV.h>
#import <SDWebImage/SDWebImageDownloader.h>
#import "SecureStorage.h"

@implementation RNFetchBlobRequest (Challenge)

-(NSURLCredential *)getUrlCredential:(NSURLAuthenticationChallenge *)challenge path:(NSString *)path password:(NSString *)password
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

- (NSString *)stringToHex:(NSString *)string
{
  char *utf8 = (char *)[string UTF8String];
  NSMutableString *hex = [NSMutableString string];
  while (*utf8) [hex appendFormat:@"%02X", *utf8++ & 0x00FF];

  return [[NSString stringWithFormat:@"%@", hex] lowercaseString];
}

-(void)runChallenge:(NSURLSession *)session
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

- (void) URLSession:(NSURLSession *)session didReceiveChallenge:(NSURLAuthenticationChallenge *)challenge completionHandler:(void (^)(NSURLSessionAuthChallengeDisposition, NSURLCredential * _Nullable credantial))completionHandler
{
  [self runChallenge:session didReceiveChallenge:challenge completionHandler:completionHandler];
}

@end
