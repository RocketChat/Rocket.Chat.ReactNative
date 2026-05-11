//
//  MMKVBridge.mm
//  RocketChatRN
//

#import "MMKVBridge.h"
#import <MMKV/MMKV.h>

@interface MMKVBridge ()
@property (nonatomic, strong) MMKV *mmkvInstance;
@end

@implementation MMKVBridge

- (instancetype)initWithID:(NSString *)mmapID
                 cryptKey:(nullable NSData *)cryptKey
                 rootPath:(nullable NSString *)rootPath {
    self = [super init];
    if (self) {
        // Initialize MMKV if needed
        if (rootPath) {
            [MMKV initializeMMKV:nil groupDir:rootPath logLevel:MMKVLogInfo];
        }
        
        // 2. Open instance with MMKVMultiProcess mode
        // This allows the Main App and Notification Service to share data safely.
        if (cryptKey && cryptKey.length > 0) {
            _mmkvInstance = [MMKV mmkvWithID:mmapID cryptKey:cryptKey mode:MMKVMultiProcess];
        } else {
            _mmkvInstance = [MMKV mmkvWithID:mmapID mode:MMKVMultiProcess];
        }
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
