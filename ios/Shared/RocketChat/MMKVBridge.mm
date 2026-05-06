//
//  MMKVBridge.mm
//  RocketChatRN
//

#import "MMKVBridge.h"
#import <MMKV/MMKV.h>

@interface MMKVBridge ()
@property (nonatomic, strong) MMKV *mmkv;
@end

@implementation MMKVBridge

- (instancetype)initWithID:(NSString *)mmapID
                 cryptKey:(nullable NSData *)cryptKey
                 rootPath:(nullable NSString *)rootPath {
    self = [super init];
    if (self) {
        // 1. Initialize MMKV path globally if provided (e.g., for App Groups)
        if (rootPath) {
            [MMKV initializeMMKV:nil groupDir:rootPath logLevel:MMKVLogInfo];
        }
        
        // 2. Open instance with MMKVMultiProcess mode
        // This allows the Main App and Notification Service to share data safely.
        if (cryptKey && cryptKey.length > 0) {
            _mmkv = [MMKV mmkvWithID:mmapID cryptKey:cryptKey mode:MMKVMultiProcess];
        } else {
            _mmkv = [MMKV mmkvWithID:mmapID mode:MMKVMultiProcess];
        }
    }
    return self;
}

- (nullable NSString *)stringForKey:(NSString *)key {
    if (!_mmkv) return nil;
    return [_mmkv getStringForKey:key];
}

- (BOOL)setString:(NSString *)value forKey:(NSString *)key {
    if (!_mmkv) return NO;
    return [_mmkv setString:value forKey:key];
}

- (nullable NSData *)dataForKey:(NSString *)key {
    if (!_mmkv) return nil;
    return [_mmkv getDataForKey:key];
}

- (BOOL)setData:(NSData *)value forKey:(NSString *)key {
    if (!_mmkv) return NO;
    return [_mmkv setData:value forKey:key];
}

- (void)removeValueForKey:(NSString *)key {
    if (!_mmkv) return;
    [_mmkv removeValueForKey:key];
}

- (NSArray<NSString *> *)allKeys {
    if (!_mmkv) return @[];
    return [_mmkv allKeys];
}

- (NSUInteger)count {
    if (!_mmkv) return 0;
    return _mmkv.count;
}

@end