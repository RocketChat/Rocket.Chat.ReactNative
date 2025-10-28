//
//  SecureStorage.h
//  RocketChatRN
//
//  Extracted from react-native-mmkv-storage for standalone use
//  Manages encryption keys in iOS Keychain
//

#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>

@interface SecureStorage : NSObject <RCTBridgeModule>

- (NSString *)getSecureKey:(NSString *)key;
- (BOOL)setSecureKey:(NSString *)key value:(NSString *)value;
- (BOOL)secureKeyExists:(NSString *)key;
- (BOOL)removeSecureKey:(NSString *)key;

@end


