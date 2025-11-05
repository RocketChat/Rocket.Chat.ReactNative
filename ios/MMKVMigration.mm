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

// Helper function to log to Xcode console (writes to stderr)
static void MMKVMigrationLog(NSString *format, ...) {
    va_list args;
    va_start(args, format);
    NSString *message = [[NSString alloc] initWithFormat:format arguments:args];
    va_end(args);
    fprintf(stderr, "[MMKVMigration] %s\n", [message UTF8String]);
    fflush(stderr);
}

// Convert string to hexadecimal (same as SSLPinning)
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
    MMKVMigrationLog(@"=== Starting MMKV Migration ===");
    
    // Check if migration already completed
    NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
    if ([defaults boolForKey:@"MMKV_MIGRATION_COMPLETED"]) {
        MMKVMigrationLog(@"Migration already completed previously");
        return;
    }
    
    @try {
        // Get app group directory
        NSString *appGroup = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"AppGroup"];
        if (!appGroup) {
            MMKVMigrationLog(@"No AppGroup found");
            [defaults setBool:YES forKey:@"MMKV_MIGRATION_COMPLETED"];
            return;
        }
        
        NSURL *groupURL = [[NSFileManager defaultManager] containerURLForSecurityApplicationGroupIdentifier:appGroup];
        NSString *groupDir = [groupURL path];
        NSString *mmkvPath = [groupDir stringByAppendingPathComponent:@"mmkv"];
        
        MMKVMigrationLog(@"App Group MMKV path: %@", mmkvPath);
        
        // Check if MMKV directory exists
        BOOL dirExists = [[NSFileManager defaultManager] fileExistsAtPath:mmkvPath];
        if (!dirExists) {
            MMKVMigrationLog(@"MMKV directory does not exist");
            [defaults setBool:YES forKey:@"MMKV_MIGRATION_COMPLETED"];
            return;
        }
        
        // List MMKV files
        NSArray *files = [[NSFileManager defaultManager] contentsOfDirectoryAtPath:mmkvPath error:nil];
        NSMutableArray *instanceIds = [NSMutableArray array];
        
        MMKVMigrationLog(@"Found %lu MMKV files", (unsigned long)files.count);
        
        for (NSString *file in files) {
            if (![file hasSuffix:@".crc"] && ![file isEqualToString:@"specialCharacter"]) {
                [instanceIds addObject:file];
            }
        }
        
        if (instanceIds.count == 0) {
            MMKVMigrationLog(@"No MMKV instances found");
            [defaults setBool:YES forKey:@"MMKV_MIGRATION_COMPLETED"];
            return;
        }
        
        MMKVMigrationLog(@"MMKV instances to migrate: %@", [instanceIds componentsJoinedByString:@", "]);
        
        // Collect all data from all instances
        NSMutableDictionary *allData = [NSMutableDictionary dictionary];
        int totalKeysFound = 0;
        
        SecureStorage *secureStorage = [[SecureStorage alloc] init];
        
        for (NSString *instanceId in instanceIds) {
            MMKVMigrationLog(@"\nReading instance: %@", instanceId);
            
            // Get encryption key from keychain
            NSString *alias = toHex([NSString stringWithFormat:@"com.MMKV.%@", instanceId]);
            NSString *password = [secureStorage getSecureKey:alias];
            
            if (password) {
                MMKVMigrationLog(@"  Found encryption key (length: %lu)", (unsigned long)password.length);
            } else {
                MMKVMigrationLog(@"  No encryption key found");
            }
            
            // Try with encryption first
            NSDictionary *instanceData = [self readInstanceData:instanceId 
                                                   withPassword:password 
                                                         atPath:mmkvPath];
            
            // If failed and we had a password, try without encryption
            if (!instanceData && password) {
                MMKVMigrationLog(@"  Retrying without encryption...");
                instanceData = [self readInstanceData:instanceId 
                                         withPassword:nil 
                                               atPath:mmkvPath];
            }
            
            if (instanceData && instanceData.count > 0) {
                MMKVMigrationLog(@"✅ Found %lu keys in %@", (unsigned long)instanceData.count, instanceId);
                totalKeysFound += (int)instanceData.count;
                [allData addEntriesFromDictionary:instanceData];
            } else {
                MMKVMigrationLog(@"No data in %@", instanceId);
            }
        }
        
        if (allData.count == 0) {
            MMKVMigrationLog(@"\nNo data found in any instance");
            [defaults setBool:YES forKey:@"MMKV_MIGRATION_COMPLETED"];
            return;
        }
        
        MMKVMigrationLog(@"\nTotal unique keys to migrate: %lu", (unsigned long)allData.count);
        
        // Write all data to the new MMKV "default" instance using MMKVBridge
        // Get encryption key for new storage
        NSString *newAlias = toHex(@"com.MMKV.default");
        NSString *newPassword = [secureStorage getSecureKey:newAlias];
        
        NSData *newCryptKey = newPassword ? [newPassword dataUsingEncoding:NSUTF8StringEncoding] : nil;
        
        if (newCryptKey) {
            MMKVMigrationLog(@"Using encryption for new storage");
        } else {
            MMKVMigrationLog(@"New storage will be unencrypted");
        }
        
        MMKVBridge *newMMKV = [[MMKVBridge alloc] initWithID:@"default" 
                                                    cryptKey:newCryptKey 
                                                    rootPath:mmkvPath];
        
        if (!newMMKV) {
            MMKVMigrationLog(@"❌ Failed to create new MMKV instance");
            return;
        }
        
        // Migrate all data
        int migratedCount = 0;
        for (NSString *key in allData) {
            id value = allData[key];
            
            if ([value isKindOfClass:[NSString class]]) {
                [newMMKV setString:(NSString *)value forKey:key];
                migratedCount++;
            } else if ([value isKindOfClass:[NSData class]]) {
                [newMMKV setData:(NSData *)value forKey:key];
                migratedCount++;
            } else if ([value isKindOfClass:[NSNumber class]]) {
                // Store as string for compatibility
                [newMMKV setString:[value stringValue] forKey:key];
                migratedCount++;
            }
        }
        
        MMKVMigrationLog(@"\n=== Migration Complete ===");
        MMKVMigrationLog(@"Total keys migrated: %d", migratedCount);
        
        // Mark migration as completed
        [defaults setBool:YES forKey:@"MMKV_MIGRATION_COMPLETED"];
        [defaults synchronize];
        
    } @catch (NSException *exception) {
        MMKVMigrationLog(@"❌ Migration error: %@", exception.reason);
    }
}

+ (NSDictionary *)readInstanceData:(NSString *)instanceId 
                      withPassword:(NSString *)password 
                            atPath:(NSString *)rootPath {
    @try {
        // Create MMKVBridge instance to read data
        NSData *cryptKey = password ? [password dataUsingEncoding:NSUTF8StringEncoding] : nil;
        
        MMKVBridge *mmkv = [[MMKVBridge alloc] initWithID:instanceId 
                                                 cryptKey:cryptKey 
                                                 rootPath:rootPath];
        
        if (!mmkv) {
            return nil;
        }
        
        // Get all keys
        NSArray *allKeys = [mmkv allKeys];
        if (!allKeys || allKeys.count == 0) {
            return nil;
        }
        
        MMKVMigrationLog(@"  Reading %lu keys...", (unsigned long)allKeys.count);
        
        NSMutableDictionary *data = [NSMutableDictionary dictionary];
        
        for (NSString *key in allKeys) {
            @try {
                // Try to read as string first (most common)
                NSString *stringValue = [mmkv stringForKey:key];
                
                if (stringValue) {
                    data[key] = stringValue;
                } else {
                    // Try as data
                    NSData *dataValue = [mmkv dataForKey:key];
                    if (dataValue) {
                        data[key] = dataValue;
                    }
                }
            } @catch (NSException *exception) {
                MMKVMigrationLog(@"  Error reading key: %@", key);
            }
        }
        
        return data.count > 0 ? data : nil;
        
    } @catch (NSException *exception) {
        MMKVMigrationLog(@"  Error reading instance: %@", exception.reason);
        return nil;
    }
}

@end

