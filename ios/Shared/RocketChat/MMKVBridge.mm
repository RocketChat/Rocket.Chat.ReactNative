//
//  MMKVBridge.mm
//  RocketChatRN
//
//  Bridge to access react-native-mmkv from Swift
//  Requires FORCE_POSIX=1 preprocessor definition
//

#import "MMKVBridge.h"
#import "MMKV.h"
#import <string>

@interface MMKVBridge()
@property (nonatomic, assign) MMKV *mmkvInstance;
@end

@implementation MMKVBridge

- (instancetype)initWithID:(NSString *)mmapID
                 cryptKey:(nullable NSData *)cryptKey
                 rootPath:(nullable NSString *)rootPath {
    self = [super init];
    if (self) {
        // Initialize MMKV if needed
        if (rootPath) {
            std::string rootPathStr = [rootPath UTF8String];
            MMKV::initializeMMKV(rootPathStr);
        }
        
        std::string mmapIDStr = [mmapID UTF8String];
        
        if (cryptKey && [cryptKey length] > 0) {
            std::string cryptKeyStr((const char *)[cryptKey bytes], [cryptKey length]);
            _mmkvInstance = MMKV::mmkvWithID(mmapIDStr, MMKV_MULTI_PROCESS, &cryptKeyStr);
        } else {
            _mmkvInstance = MMKV::mmkvWithID(mmapIDStr, MMKV_MULTI_PROCESS);
        }
    }
    return self;
}

- (nullable NSString *)stringForKey:(NSString *)key {
    if (!_mmkvInstance) return nil;
    
    std::string keyStr = [key UTF8String];
    std::string valueStr;
    bool hasValue = _mmkvInstance->getString(keyStr, valueStr);
    
    if (hasValue && !valueStr.empty()) {
        return [NSString stringWithUTF8String:valueStr.c_str()];
    }
    
    return nil;
}

- (BOOL)setString:(NSString *)value forKey:(NSString *)key {
    if (!_mmkvInstance) return NO;
    
    std::string keyStr = [key UTF8String];
    std::string valueStr = [value UTF8String];
    
    return _mmkvInstance->set(valueStr, keyStr);
}

- (nullable NSData *)dataForKey:(NSString *)key {
    if (!_mmkvInstance) return nil;
    
    std::string keyStr = [key UTF8String];
    auto buffer = _mmkvInstance->getBytes(keyStr);
    
    if (buffer.length() > 0) {
        return [NSData dataWithBytes:buffer.getPtr() length:buffer.length()];
    }
    
    return nil;
}

- (BOOL)setData:(NSData *)value forKey:(NSString *)key {
    if (!_mmkvInstance) return NO;
    
    std::string keyStr = [key UTF8String];
    mmkv::MMBuffer buffer((void *)[value bytes], (size_t)[value length], mmkv::MMBufferNoCopy);
    
    return _mmkvInstance->set(buffer, keyStr);
}

- (void)removeValueForKey:(NSString *)key {
    if (!_mmkvInstance) return;
    
    std::string keyStr = [key UTF8String];
    _mmkvInstance->removeValueForKey(keyStr);
}

@end
