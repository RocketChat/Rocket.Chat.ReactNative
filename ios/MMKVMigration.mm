//
//  MMKVMigration.mm
//  RocketChatRN
//
//  MMKV Migration - reads encrypted old MMKV data and migrates to new storage
//  Uses MMKV C++ library directly to read and decrypt old data
//

#import "MMKVMigration.h"
#import "SecureStorage.h"
#import "Shared/RocketChat/MMKVBridge.h"

static NSString *toHex(NSString *str) {
    if (!str) return @"";

    const char *utf8 = [str UTF8String];
    NSMutableString *hex = [NSMutableString string];

    while (*utf8) {
        [hex appendFormat:@"%02X", (unsigned char)*utf8++];
    }

    return [hex lowercaseString];
}

@implementation MMKVMigration

+ (void)migrate {
    NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
    if ([defaults boolForKey:@"MMKV_MIGRATION_COMPLETED"]) {
        return;
    }

    @try {
        NSString *appGroup = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"AppGroup"];
        if (!appGroup) {
            [defaults setBool:YES forKey:@"MMKV_MIGRATION_COMPLETED"];
            return;
        }

        NSURL *groupURL = [[NSFileManager defaultManager] containerURLForSecurityApplicationGroupIdentifier:appGroup];
        if (!groupURL) {
            [defaults setBool:YES forKey:@"MMKV_MIGRATION_COMPLETED"];
            return;
        }
        
        NSString *groupDir = [groupURL path];
        NSString *mmkvPath = [groupDir stringByAppendingPathComponent:@"mmkv"];

        BOOL directoryExists = [[NSFileManager defaultManager] fileExistsAtPath:mmkvPath];
        if (!directoryExists) {
            NSArray *documentsPaths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
            if (documentsPaths.count > 0) {
                NSString *documentsDir = documentsPaths[0];
                NSString *documentsMMKVPath = [documentsDir stringByAppendingPathComponent:@"mmkv"];
                if ([[NSFileManager defaultManager] fileExistsAtPath:documentsMMKVPath]) {
                    mmkvPath = documentsMMKVPath;
                    directoryExists = YES;
                }
            }

            if (!directoryExists) {
                [defaults setBool:YES forKey:@"MMKV_MIGRATION_COMPLETED"];
                return;
            }
        }

        NSArray *files = [[NSFileManager defaultManager] contentsOfDirectoryAtPath:mmkvPath error:nil];
        NSMutableArray *instanceIds = [NSMutableArray array];

        for (NSString *file in files) {
            if (![file hasSuffix:@".crc"] && ![file isEqualToString:@"specialCharacter"]) {
                [instanceIds addObject:file];
            }
        }

        NSArray *possibleInstanceIds = @[@"mmkvIDStore", @"default", @"mmkv.default"];
        for (NSString *instanceId in possibleInstanceIds) {
            if (![instanceIds containsObject:instanceId]) {
                NSString *possiblePath = [mmkvPath stringByAppendingPathComponent:instanceId];
                if ([[NSFileManager defaultManager] fileExistsAtPath:possiblePath]) {
                    [instanceIds addObject:instanceId];
                }
            }
        }

        if (instanceIds.count == 0) {
            [defaults setBool:YES forKey:@"MMKV_MIGRATION_COMPLETED"];
            return;
        }

        NSMutableDictionary *allData = [NSMutableDictionary dictionary];
        SecureStorage *secureStorage = [[SecureStorage alloc] init];

        for (NSString *instanceId in instanceIds) {
            NSString *alias = toHex([NSString stringWithFormat:@"com.MMKV.%@", instanceId]);
            NSString *password = [secureStorage getSecureKey:alias];

            NSDictionary *instanceData = [self readInstanceData:instanceId
                                                   withPassword:password
                                                         atPath:mmkvPath];

            if (!instanceData && password) {
                instanceData = [self readInstanceData:instanceId
                                         withPassword:nil
                                               atPath:mmkvPath];
            }

            if (instanceData.count > 0) {
                [allData addEntriesFromDictionary:instanceData];
            }
        }

        if (allData.count == 0) {
            [defaults setBool:YES forKey:@"MMKV_MIGRATION_COMPLETED"];
            return;
        }

        NSString *newAlias = toHex(@"com.MMKV.default");
        NSString *newPassword = [secureStorage getSecureKey:newAlias];
        NSData *newCryptKey = newPassword ? [newPassword dataUsingEncoding:NSUTF8StringEncoding] : nil;

        MMKVBridge *newMMKV = [[MMKVBridge alloc] initWithID:@"default"
                                                    cryptKey:newCryptKey
                                                    rootPath:mmkvPath];
        if (!newMMKV) {
            return;
        }

        NSInteger migratedCount = 0;
        for (NSString *key in allData) {
            id value = allData[key];

            if ([value isKindOfClass:[NSString class]]) {
                [newMMKV setString:(NSString *)value forKey:key];
                migratedCount++;
            } else if ([value isKindOfClass:[NSData class]]) {
                [newMMKV setData:(NSData *)value forKey:key];
                migratedCount++;
            } else if ([value isKindOfClass:[NSNumber class]]) {
                [newMMKV setString:[value stringValue] forKey:key];
                migratedCount++;
            }
        }

        [defaults setBool:YES forKey:@"MMKV_MIGRATION_COMPLETED"];
        [defaults setObject:@(migratedCount) forKey:@"MMKV_MIGRATION_KEYS_COUNT"];
        [defaults setObject:[NSDate date].description forKey:@"MMKV_MIGRATION_TIMESTAMP"];
        [defaults synchronize];
    } @catch (__unused NSException *exception) {
    }
}

+ (NSDictionary *)readInstanceData:(NSString *)instanceId
                      withPassword:(NSString *)password
                            atPath:(NSString *)rootPath {
    @try {
        NSData *cryptKey = password ? [password dataUsingEncoding:NSUTF8StringEncoding] : nil;

        MMKVBridge *mmkv = [[MMKVBridge alloc] initWithID:instanceId
                                                 cryptKey:cryptKey
                                                 rootPath:rootPath];
        if (!mmkv) {
            return nil;
        }

        NSArray *allKeys = [mmkv allKeys];
        if (!allKeys || allKeys.count == 0) {
            return nil;
        }

        NSMutableDictionary *data = [NSMutableDictionary dictionary];

        for (NSString *key in allKeys) {
            @try {
                NSString *stringValue = [mmkv stringForKey:key];
                if (stringValue) {
                    data[key] = stringValue;
                } else {
                    NSData *dataValue = [mmkv dataForKey:key];
                    if (dataValue) {
                        data[key] = dataValue;
                    }
                }
            } @catch (__unused NSException *exception) {
            }
        }

        return data.count > 0 ? data : nil;
    } @catch (__unused NSException *exception) {
        return nil;
    }
}

@end


