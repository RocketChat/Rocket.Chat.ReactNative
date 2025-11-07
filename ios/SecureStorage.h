#import <React/RCTBridgeModule.h>
#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>

@interface SecureStorage: NSObject <RCTBridgeModule>

- (void) setSecureKey: (nonnull NSString *)key value:(nonnull NSString *)value
              options: (nonnull NSDictionary *)options;
- (nullable NSString *) getSecureKey:(nonnull NSString *)key;
- (bool) secureKeyExists:(nonnull NSString *)key;
- (void) removeSecureKey:(nonnull NSString *)key;

- (BOOL)searchKeychainCopyMatchingExists:(nonnull NSString *)identifier;

- (nonnull NSString *)searchKeychainCopyMatching:(nonnull NSString *)identifier;

- (nonnull NSMutableDictionary *)newSearchDictionary:(nonnull NSString *)identifier;

- (BOOL)createKeychainValue:(nonnull NSString *)value forIdentifier:(nonnull NSString *)identifier options: (NSDictionary * __nullable)options;

- (BOOL)updateKeychainValue:(nonnull NSString *)password forIdentifier:(nonnull NSString *)identifier options:(NSDictionary * __nullable)options;

- (BOOL)deleteKeychainValue:(nonnull NSString *)identifier;

- (void)clearSecureKeyStore;

- (void)handleAppUninstallation;

- (void) setServiceName: (nonnull NSString *)serviceName;

@end
