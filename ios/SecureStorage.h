#import <React/RCTBridgeModule.h>
#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>

@interface SecureStorage: NSObject <RCTBridgeModule>

- (void) setSecureKey: (nonnull NSString *)key value:(nonnull NSString *)value
              options: (nonnull NSDictionary *)options;
- (nullable NSString *) getSecureKey:(nonnull NSString *)key;

- (nonnull NSString *)searchKeychainCopyMatching:(nonnull NSString *)identifier;

- (nonnull NSMutableDictionary *)newSearchDictionary:(nonnull NSString *)identifier;

- (BOOL)createKeychainValue:(nonnull NSString *)value forIdentifier:(nonnull NSString *)identifier options: (NSDictionary * __nullable)options;

- (BOOL)updateKeychainValue:(nonnull NSString *)password forIdentifier:(nonnull NSString *)identifier options:(NSDictionary * __nullable)options;

- (BOOL)deleteKeychainValue:(nonnull NSString *)identifier;

- (void)handleAppUninstallation;

@end
