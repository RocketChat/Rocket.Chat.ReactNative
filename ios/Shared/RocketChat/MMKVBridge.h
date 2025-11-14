//
//  MMKVBridge.h
//  RocketChatRN
//
//  Bridge to access react-native-mmkv from Swift
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface MMKVBridge : NSObject

- (instancetype)initWithID:(NSString *)mmapID
                 cryptKey:(nullable NSData *)cryptKey
                 rootPath:(nullable NSString *)rootPath;

- (nullable NSString *)stringForKey:(NSString *)key;
- (BOOL)setString:(NSString *)value forKey:(NSString *)key;
- (nullable NSData *)dataForKey:(NSString *)key;
- (BOOL)setData:(NSData *)value forKey:(NSString *)key;
- (void)removeValueForKey:(NSString *)key;
- (NSArray<NSString *> *)allKeys;

@end

NS_ASSUME_NONNULL_END

