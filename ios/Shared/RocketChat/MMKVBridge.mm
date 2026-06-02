//
//  MMKVBridge.mm
//  RocketChatRN
//

#import "MMKVBridge.h"
#import <MMKV/MMKV.h>

@interface MMKVBridge()
@property (nonatomic, strong) MMKV *mmkvInstance;
@end

@implementation MMKVBridge

- (instancetype)initWithID:(NSString *)mmapID
                 cryptKey:(nullable NSData *)cryptKey
                 rootPath:(nullable NSString *)rootPath {
    self = [super init];
    if (self) {
        // Idempotent safety net; react-native-mmkv usually initializes MMKV first from JS.
        [MMKV initializeMMKV:nil logLevel:MMKVLogInfo];

        // Normalize: callers may pass either the App Group container path or
        // <container>/mmkv. We always resolve to <container>/mmkv so the file
        // matches the relativePath react-native-mmkv writes from JS.
        NSString *resolvedRootPath = rootPath;
        if (resolvedRootPath.length > 0 && ![resolvedRootPath.lastPathComponent isEqualToString:@"mmkv"]) {
            resolvedRootPath = [resolvedRootPath stringByAppendingPathComponent:@"mmkv"];
        }

        NSData *finalCryptKey = (cryptKey.length > 0) ? cryptKey : nil;
        _mmkvInstance = [MMKV mmkvWithID:mmapID
                                cryptKey:finalCryptKey
                                rootPath:resolvedRootPath
                                    mode:MMKVMultiProcess
                        expectedCapacity:0];
    }
    return self;
}

- (nullable NSString *)stringForKey:(NSString *)key {
    if (!_mmkvInstance) return nil;
    return [_mmkvInstance getStringForKey:key];
}

- (BOOL)setString:(NSString *)value forKey:(NSString *)key {
    if (!_mmkvInstance) return NO;
    return [_mmkvInstance setString:value forKey:key];
}

- (nullable NSData *)dataForKey:(NSString *)key {
    if (!_mmkvInstance) return nil;
    return [_mmkvInstance getDataForKey:key];
}

- (BOOL)setData:(NSData *)value forKey:(NSString *)key {
    if (!_mmkvInstance) return NO;
    return [_mmkvInstance setData:value forKey:key];
}

- (void)removeValueForKey:(NSString *)key {
    if (!_mmkvInstance) return;
    [_mmkvInstance removeValueForKey:key];
}

- (NSArray<NSString *> *)allKeys {
    if (!_mmkvInstance) return @[];
    return [_mmkvInstance allKeys];
}

- (NSUInteger)count {
    if (!_mmkvInstance) return 0;
    return _mmkvInstance.count;
}

@end
