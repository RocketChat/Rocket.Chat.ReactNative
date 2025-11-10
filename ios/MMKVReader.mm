//
//  MMKVReader.mm
//  RocketChatRN
//
//  Native module to read old MMKV storage for migration
//  Uses MMKV C++ library directly to read and decrypt old storage
//

#import "MMKVReader.h"
#import "SecureStorage.h"
#import "MMKV.h"
#import <string>

@implementation MMKVReader

RCT_EXPORT_MODULE(MMKVReader)

+ (BOOL)requiresMainQueueSetup {
    return NO;
}


/**
 * Convert string to hexadecimal (same as Android implementation)
 */
- (NSString *)toHex:(NSString *)str {
    if (!str) return @"";
    
    const char *utf8String = [str UTF8String];
    NSMutableString *hexString = [NSMutableString string];
    
    while (*utf8String) {
        [hexString appendFormat:@"%x", (unsigned char)*utf8String++];
    }
    
    return hexString;
}

/**
 * Get storage paths for debugging
 */
RCT_EXPORT_METHOD(getStoragePath:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    @try {
        NSString *appGroup = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"AppGroup"];
        NSURL *groupURL = [[NSFileManager defaultManager] containerURLForSecurityApplicationGroupIdentifier:appGroup];
        NSString *groupDir = [groupURL path];
        NSString *mmkvDir = [groupDir stringByAppendingPathComponent:@"mmkv"];
        
        BOOL mmkvDirExists = [[NSFileManager defaultManager] fileExistsAtPath:mmkvDir];
        
        NSDictionary *result = @{
            @"filesDir": groupDir ?: @"",
            @"mmkvDir": mmkvDir ?: @"",
            @"mmkvDirExists": @(mmkvDirExists)
        };
        
        resolve(result);
    } @catch (NSException *exception) {
        reject(@"ERROR", exception.reason, nil);
    }
}

/**
 * List MMKV files in storage directory
 */
RCT_EXPORT_METHOD(listMMKVFiles:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    @try {
        NSString *appGroup = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"AppGroup"];
        NSURL *groupURL = [[NSFileManager defaultManager] containerURLForSecurityApplicationGroupIdentifier:appGroup];
        NSString *groupDir = [groupURL path];
        NSString *mmkvDir = [groupDir stringByAppendingPathComponent:@"mmkv"];
        
        NSMutableArray *filesList = [NSMutableArray array];
        
        if ([[NSFileManager defaultManager] fileExistsAtPath:mmkvDir]) {
            NSArray *files = [[NSFileManager defaultManager] contentsOfDirectoryAtPath:mmkvDir error:nil];
            
            for (NSString *fileName in files) {
                NSString *filePath = [mmkvDir stringByAppendingPathComponent:fileName];
                NSDictionary *attrs = [[NSFileManager defaultManager] attributesOfItemAtPath:filePath error:nil];
                
                NSDictionary *fileInfo = @{
                    @"name": fileName,
                    @"path": filePath,
                    @"size": attrs[NSFileSize] ?: @0,
                    @"isFile": @([attrs[NSFileType] isEqualToString:NSFileTypeRegular])
                };
                
                [filesList addObject:fileInfo];
            }
        }
        
        
        resolve(filesList);
    } @catch (NSException *exception) {
        reject(@"ERROR", exception.reason, nil);
    }
}

/**
 * Read and decrypt MMKV storage
 * Main migration method - reads all key-value pairs from old MMKV storage
 */
RCT_EXPORT_METHOD(readAndDecryptMMKV:(NSString *)mmkvId
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    @try {
     
        // Get app group directory
        NSString *appGroup = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"AppGroup"];
        NSURL *groupURL = [[NSFileManager defaultManager] containerURLForSecurityApplicationGroupIdentifier:appGroup];
        NSString *groupDir = [groupURL path];
        NSString *mmkvPath = [groupDir stringByAppendingPathComponent:@"mmkv"];
        
        
        // Initialize MMKV with the root path
        std::string mmkvPathStr = [mmkvPath UTF8String];
        MMKV::initializeMMKV(mmkvPathStr);
        
        // Get encryption key from keychain
        SecureStorage *secureStorage = [[SecureStorage alloc] init];
        NSString *alias = [self toHex:[NSString stringWithFormat:@"com.MMKV.%@", mmkvId]];
        NSString *password = [secureStorage getSecureKey:alias];
        
        
        // Open MMKV instance with encryption key
        MMKV *mmkv = nullptr;
        std::string mmkvIdStr = [mmkvId UTF8String];
        
        if (password && password.length > 0) {
            NSData *cryptKeyData = [password dataUsingEncoding:NSUTF8StringEncoding];
            std::string cryptKeyStr((const char *)[cryptKeyData bytes], [cryptKeyData length]);
            mmkv = MMKV::mmkvWithID(mmkvIdStr, MMKV_MULTI_PROCESS, &cryptKeyStr);
        } else {
            mmkv = MMKV::mmkvWithID(mmkvIdStr, MMKV_MULTI_PROCESS);
        }
        
        if (!mmkv) {
            reject(@"NO_MMKV", @"Could not open MMKV instance", nil);
            return;
        }
        
        
        // Get all keys
        auto allKeys = mmkv->allKeys();
        
        if (allKeys.empty()) {
            resolve(@{});
            return;
        }
        
        
        // Read all key-value pairs
        NSMutableDictionary *result = [NSMutableDictionary dictionary];
        int stringCount = 0;
        int intCount = 0;
        int boolCount = 0;
        
        for (const auto& keyStr : allKeys) {
            @try {
                NSString *key = [NSString stringWithUTF8String:keyStr.c_str()];
                
                // Try to read as string first (most common)
                std::string valueStr;
                bool hasValue = mmkv->getString(keyStr, valueStr);
                
                if (hasValue && !valueStr.empty()) {
                    NSString *value = [NSString stringWithUTF8String:valueStr.c_str()];
                    result[key] = value;
                    stringCount++;
                    
                    // Log with truncation for long values
                    NSString *displayValue = value.length > 100
                        ? [NSString stringWithFormat:@"%@... (+%lu more chars)", [value substringToIndex:100], (unsigned long)(value.length - 100)]
                        : value;
                    
                } else {
                    // Try as int
                    int32_t intValue = 0;
                    bool hasInt = mmkv->getInt32(keyStr, intValue);
                    
                    if (hasInt) {
                        result[key] = @(intValue);
                        intCount++;
                    } else {
                        // Try as boolean
                        bool boolValue = mmkv->getBool(keyStr, false);
                        result[key] = @(boolValue);
                        boolCount++;
                    }
                }
            } @catch (NSException *exception) {
                RCTLogError(@"❌ Error reading key: %s - %@", keyStr.c_str(), exception.reason);
            }
        }
    
        resolve(result);
    } @catch (NSException *exception) {
        RCTLogError(@"Error reading MMKV: %@", exception.reason);
        reject(@"ERROR", exception.reason, nil);
    }
}

@end

