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
#import <os/log.h>

// Helper function to log to Xcode console (writes to stderr AND os_log)
static void MMKVMigrationLog(NSString *format, ...) {
    va_list args;
    va_start(args, format);
    NSString *message = [[NSString alloc] initWithFormat:format arguments:args];
    va_end(args);
    
    // Write to stderr (visible in Xcode console during debug)
    fprintf(stderr, "[MMKVMigration] %s\n", [message UTF8String]);
    fflush(stderr);
    
    // Write to os_log (persists for TestFlight/production debugging)
    os_log_t log = os_log_create("chat.rocket.reactnative", "MMKVMigration");
    os_log(log, "%{public}s", [message UTF8String]);
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
    
    // Log build configuration
    #ifdef DEBUG
    MMKVMigrationLog(@"Build: DEBUG");
    #else
    MMKVMigrationLog(@"Build: RELEASE/PRODUCTION");
    #endif
    
    // Log bundle identifier
    NSString *bundleId = [[NSBundle mainBundle] bundleIdentifier];
    MMKVMigrationLog(@"Bundle ID: %@", bundleId);
    
    // Check if migration already completed
    NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
    if ([defaults boolForKey:@"MMKV_MIGRATION_COMPLETED"]) {
        MMKVMigrationLog(@"Migration already completed previously");
        return;
    }
    
    MMKVMigrationLog(@"Migration NOT yet completed - proceeding...");
    
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
            MMKVMigrationLog(@"\n========================================");
            MMKVMigrationLog(@"Reading instance: %@", instanceId);
            
            // Check file size first
            NSString *instanceFile = [mmkvPath stringByAppendingPathComponent:instanceId];
            NSDictionary *attrs = [[NSFileManager defaultManager] attributesOfItemAtPath:instanceFile error:nil];
            unsigned long long fileSize = [attrs fileSize];
            MMKVMigrationLog(@"  File path: %@", instanceFile);
            MMKVMigrationLog(@"  File size: %llu bytes", fileSize);
            
            // Get encryption key from keychain
            NSString *alias = toHex([NSString stringWithFormat:@"com.MMKV.%@", instanceId]);
            MMKVMigrationLog(@"  Keychain alias (hex): %@", alias);
            
            NSString *password = [secureStorage getSecureKey:alias];
            
            if (password) {
                MMKVMigrationLog(@"  ✅ Found encryption key (length: %lu)", (unsigned long)password.length);
                MMKVMigrationLog(@"  Encryption key preview: %@...", [password substringToIndex:MIN(16, password.length)]);
            } else {
                MMKVMigrationLog(@"  ⚠️ No encryption key found in keychain");
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
                MMKVMigrationLog(@"  ✅✅✅ SUCCESS! Found %lu keys in %@", (unsigned long)instanceData.count, instanceId);
                totalKeysFound += (int)instanceData.count;
                
                // Log ALL keys found in this instance
                MMKVMigrationLog(@"  Keys found in %@:", instanceId);
                for (NSString *key in instanceData) {
                    id value = instanceData[key];
                    if ([value isKindOfClass:[NSString class]]) {
                        NSString *strValue = (NSString *)value;
                        NSString *display = strValue.length > 50 
                            ? [[strValue substringToIndex:50] stringByAppendingString:@"..."]
                            : strValue;
                        MMKVMigrationLog(@"    - %@ = %@", key, display);
                    } else if ([value isKindOfClass:[NSData class]]) {
                        MMKVMigrationLog(@"    - %@ = <Data: %lu bytes>", key, (unsigned long)[(NSData *)value length]);
                    } else {
                        MMKVMigrationLog(@"    - %@ = <%@>", key, [value class]);
                    }
                }
                
                [allData addEntriesFromDictionary:instanceData];
            } else {
                MMKVMigrationLog(@"  ❌❌❌ No data in %@", instanceId);
            }
            MMKVMigrationLog(@"========================================");
        }
        
        if (allData.count == 0) {
            MMKVMigrationLog(@"\nNo data found in any instance");
            [defaults setBool:YES forKey:@"MMKV_MIGRATION_COMPLETED"];
            return;
        }
        
        MMKVMigrationLog(@"\nTotal unique keys to migrate: %lu", (unsigned long)allData.count);
        
        // List all keys being migrated
        MMKVMigrationLog(@"Keys to migrate:");
        for (NSString *key in allData) {
            MMKVMigrationLog(@"  - %@", key);
        }
        
        // Write all data to the new MMKV "default" instance using MMKVBridge
        // Get encryption key for new storage
        NSString *newAlias = toHex(@"com.MMKV.default");
        MMKVMigrationLog(@"\nGetting encryption key for new storage with alias: %@", newAlias);
        
        NSString *newPassword = [secureStorage getSecureKey:newAlias];
        
        NSData *newCryptKey = newPassword ? [newPassword dataUsingEncoding:NSUTF8StringEncoding] : nil;
        
        if (newCryptKey) {
            MMKVMigrationLog(@"Using encryption for new storage (key length: %lu)", (unsigned long)newPassword.length);
        } else {
            MMKVMigrationLog(@"New storage will be unencrypted");
        }
        
        MMKVMigrationLog(@"Creating new MMKVBridge instance at path: %@", mmkvPath);
        
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
                
                
                // Log important keys
                if ([key containsString:@"CURRENT_SERVER"] || 
                    [key containsString:@"reactnativemeteor_usertoken"] ||
                    [key containsString:@"THEME"]) {
                    NSString *displayValue = [(NSString *)value length] > 50 
                        ? [[(NSString *)value substringToIndex:50] stringByAppendingString:@"..."]
                        : (NSString *)value;
                    MMKVMigrationLog(@"  📝 Migrated: %@ = %@", key, displayValue);
                }
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
        
        // Mark migration as completed with metadata
        [defaults setBool:YES forKey:@"MMKV_MIGRATION_COMPLETED"];
        [defaults setObject:@(migratedCount) forKey:@"MMKV_MIGRATION_KEYS_COUNT"];
        [defaults setObject:[NSDate date].description forKey:@"MMKV_MIGRATION_TIMESTAMP"];
        [defaults synchronize];
        
        MMKVMigrationLog(@"Migration metadata saved to UserDefaults");
        
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
        
        MMKVMigrationLog(@"  Creating MMKVBridge with ID: %@, cryptKey: %@, rootPath: %@", 
                        instanceId, 
                        cryptKey ? @"YES" : @"NO",
                        rootPath);
        
        MMKVBridge *mmkv = [[MMKVBridge alloc] initWithID:instanceId 
                                                 cryptKey:cryptKey 
                                                 rootPath:rootPath];
        
        if (!mmkv) {
            MMKVMigrationLog(@"  ❌ Failed to create MMKVBridge instance");
            return nil;
        }
        
        MMKVMigrationLog(@"  ✅ MMKVBridge instance created");
        
        // Get all keys
        NSArray *allKeys = [mmkv allKeys];
        MMKVMigrationLog(@"  allKeys returned: %@", allKeys ? [NSString stringWithFormat:@"%lu keys", (unsigned long)allKeys.count] : @"nil");
        
        if (!allKeys || allKeys.count == 0) {
            MMKVMigrationLog(@"  No keys found in instance");
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
                    MMKVMigrationLog(@"    ✓ Read string key: %@", key);
                } else {
                    // Try as data
                    NSData *dataValue = [mmkv dataForKey:key];
                    if (dataValue) {
                        data[key] = dataValue;
                        MMKVMigrationLog(@"    ✓ Read data key: %@", key);
                    } else {
                        MMKVMigrationLog(@"    ⚠️ Could not read key: %@", key);
                    }
                }
            } @catch (NSException *exception) {
                MMKVMigrationLog(@"  ❌ Error reading key %@: %@", key, exception.reason);
            }
        }
        
        MMKVMigrationLog(@"  Successfully read %lu/%lu keys", (unsigned long)data.count, (unsigned long)allKeys.count);
        
        return data.count > 0 ? data : nil;
        
    } @catch (NSException *exception) {
        MMKVMigrationLog(@"  ❌ Exception reading instance: %@", exception.reason);
        return nil;
    }
}

@end

