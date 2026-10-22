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
#import "SecureStorage.h"

@interface Challenge ()
+ (NSString *)stringToHex:(NSString *)string;
+ (nullable NSURLCredential *)credentialForPath:(NSString *)path password:(NSString *)password;
@end

@implementation Challenge

+ (MMKVBridge *)getMMKVInstance {
  SecureStorage *secureStorage = [[SecureStorage alloc] init];
  NSString *hexKey = [self stringToHex:@"com.MMKV.default"];
  NSString *key = [secureStorage getSecureKey:hexKey];

  NSData *cryptKey = (key && [key length] > 0) ? [key dataUsingEncoding:NSUTF8StringEncoding] : nil;

  // Use same App Group path as MMKVKeyManager.mm to access shared SSL certificates
  NSString *appGroup = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"AppGroupIdentifier"];
  NSString *rootPath = nil;
  if (appGroup) {
    NSURL *groupURL = [[NSFileManager defaultManager] containerURLForSecurityApplicationGroupIdentifier:appGroup];
    rootPath = [groupURL path];
  }

  MMKVBridge *mmkvBridge = [[MMKVBridge alloc] initWithID:@"default" cryptKey:cryptKey rootPath:rootPath];

  return mmkvBridge;
}

+ (nullable NSURLCredential *)credentialForPath:(NSString *)path password:(NSString *)password
{
  NSData *p12data = [NSData dataWithContentsOfFile:path];
  if (!p12data) {
    return nil;
  }

  NSDictionary* options = @{ (id)kSecImportExportPassphrase:password };
  CFArrayRef rawItems = NULL;
  if (SecPKCS12Import((__bridge CFDataRef)p12data, (__bridge CFDictionaryRef)options, &rawItems) != errSecSuccess) {
    return nil;
  }

  NSDictionary* firstItem = [(NSArray*)CFBridgingRelease(rawItems) firstObject];
  NS_VALID_UNTIL_END_OF_SCOPE id identityObject = firstItem[(id)kSecImportItemIdentity];
  SecIdentityRef identity = (__bridge SecIdentityRef)identityObject;
  if (!identity) {
    return nil;
  }
  NSArray *certificates = [self intermediateCertificates:identity chain:firstItem[(id)kSecImportItemCertChain]];

  return [NSURLCredential credentialWithIdentity:identity certificates:certificates persistence:NSURLCredentialPersistenceNone];
}

+ (NSString *)stringToHex:(NSString *)string
{
  char *utf8 = (char *)[string UTF8String];
  NSMutableString *hex = [NSMutableString string];
  while (*utf8) [hex appendFormat:@"%02X", *utf8++ & 0x00FF];

  return [[NSString stringWithFormat:@"%@", hex] lowercaseString];
}

+ (NSArray *)intermediateCertificates:(SecIdentityRef)identity chain:(NSArray *)chain
{
  SecCertificateRef leaf = NULL;
  SecIdentityCopyCertificate(identity, &leaf);
  NSMutableArray *certificates = [[NSMutableArray alloc] init];
  for (id certificate in chain) {
    if (!leaf || !CFEqual((__bridge CFTypeRef)certificate, leaf)) {
      [certificates addObject:certificate];
    }
  }
  if (leaf) { CFRelease(leaf); }
  return certificates;
}

+ (nullable NSURLCredential *)clientCertificateCredential:(NSURLAuthenticationChallenge *)challenge
{
  if (![challenge.protectionSpace.authenticationMethod isEqualToString:NSURLAuthenticationMethodClientCertificate]) {
    return nil;
  }

  NSString *clientSSL = [[self getMMKVInstance] stringForKey:challenge.protectionSpace.host];
  if (!clientSSL) {
    return nil;
  }

  NSData *data = [clientSSL dataUsingEncoding:NSUTF8StringEncoding];
  id dict = [NSJSONSerialization JSONObjectWithData:data options:0 error:nil];
  NSString *path = [dict objectForKey:@"path"];
  NSString *password = [dict objectForKey:@"password"];
  if (!path || !password) {
    return nil;
  }

  return [self credentialForPath:path password:password];
}

+ (void)runChallenge:(NSURLSession *)session
 didReceiveChallenge:(NSURLAuthenticationChallenge *)challenge
  completionHandler:(void (^)(NSURLSessionAuthChallengeDisposition disposition, NSURLCredential *credential))completionHandler
{
  NSURLCredential *credential = [self clientCertificateCredential:challenge]
    ?: [NSURLCredential credentialForTrust:challenge.protectionSpace.serverTrust];
  completionHandler(NSURLSessionAuthChallengeUseCredential, credential);
}

@end
