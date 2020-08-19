//
//  SecureStorage.h
//  RocketChatRN
//
//  https://github.com/ammarahm-ed/react-native-mmkv-storage/blob/master/ios/SecureStorage.h
//

#if __has_include("RCTBridgeModule.h")
#import "RCTBridgeModule.h"
#else
#import <React/RCTBridgeModule.h>
#endif

#import <Foundation/Foundation.h>

@interface SecureStorage: NSObject



- (void) setSecureKey: (nonnull NSString *)key value:(nonnull NSString *)value
              options: (nonnull NSDictionary *)options
             callback:(nullable RCTResponseSenderBlock)callback;
- (nullable NSString *) getSecureKey:(nonnull NSString *)key
                            callback:(nullable RCTResponseSenderBlock)callback;
- (bool) secureKeyExists:(nonnull NSString *)key
                callback:(nullable RCTResponseSenderBlock)callback;
- (void) removeSecureKey:(nonnull NSString *)key
                callback:(nullable RCTResponseSenderBlock)callback;

- (BOOL)searchKeychainCopyMatchingExists:(nonnull NSString *)identifier;

- (nonnull NSString *)searchKeychainCopyMatching:(nonnull NSString *)identifier;

- (nonnull NSMutableDictionary *)newSearchDictionary:(nonnull NSString *)identifier;

- (BOOL)createKeychainValue:(nonnull NSString *)value forIdentifier:(nonnull NSString *)identifier options: (NSDictionary * __nullable)options;

- (BOOL)updateKeychainValue:(nonnull NSString *)password forIdentifier:(nonnull NSString *)identifier options:(NSDictionary * __nullable)options;

- (BOOL)deleteKeychainValue:(nonnull NSString *)identifier;

- (void)clearSecureKeyStore;

- (void)handleAppUninstallation;



@end
