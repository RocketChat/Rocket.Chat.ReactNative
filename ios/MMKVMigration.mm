//
//  MMKVMigration.mm
//  RocketChatRN
//
//  MMKV Migration - removes encryption from old MMKV data using reKey()
//  Uses MMKV's built-in reKey to remove encryption in-place (simpler and safer than copying)
//

#import "MMKVMigration.h"
#import "SecureStorage.h"
#import "Shared/RocketChat/MMKVBridge.h"
#import <os/log.h>

static NSString *const kMigrationFlagKey = kMigrationFlagKey;

static NSString *toHex(NSString *str) {
    if (!str) return @"";

    const char *utf8 = [str UTF8String];
    NSMutableString *hex = [NSMutableString string];

    while (*utf8) {
        [hex appendFormat:@"%02X", (unsigned char)*utf8++];
    }

    return [hex lowercaseString];
}

static os_log_t migration_log(void) {
    static os_log_t log = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        log = os_log_create("chat.rocket.reactnative", "MMKVMigration");
    });
    return log;
}

@implementation MMKVMigration

+ (void)migrate {
    NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
    if ([defaults boolForKey:kMigrationFlagKey]) {
        // Still need to ensure MMKV is initialized for other code (e.g., SSLPinning)
        [self initializeMMKV];
        return;
    }

    @try {
        NSString *mmkvPath = [self initializeMMKV];
        if (!mmkvPath) {
            [defaults setBool:YES forKey:kMigrationFlagKey];
            return;
        }

        SecureStorage *secureStorage = [[SecureStorage alloc] init];
        NSString *alias = toHex(@"com.MMKV.default");
        NSString *password = [secureStorage getSecureKey:alias];

        if (!password || password.length == 0) {
            // No encryption, nothing to migrate
            os_log_info(migration_log(), "No encryption key found, skipping migration");
            [defaults setBool:YES forKey:kMigrationFlagKey];
            return;
        }

        NSData *cryptKey = [password dataUsingEncoding:NSUTF8StringEncoding];
        MMKVBridge *mmkv = [[MMKVBridge alloc] initWithID:@"default"
                                                cryptKey:cryptKey
                                                rootPath:mmkvPath];

        if (!mmkv) {
            os_log_error(migration_log(), "Failed to open MMKV instance");
            return;
        }

        NSUInteger keyCount = [mmkv count];
        if (keyCount == 0) {
            os_log_info(migration_log(), "No data to migrate");
            [defaults setBool:YES forKey:kMigrationFlagKey];
            return;
        }

        os_log_info(migration_log(), "Found %lu keys, removing encryption...", (unsigned long)keyCount);

        BOOL success = [mmkv reKey:nil];
        if (success) {
            // Remove encryption key from Keychain
            [secureStorage deleteSecureKey:alias];
            
            os_log_info(migration_log(), "Migration successful: %lu keys, encryption removed", (unsigned long)keyCount);
            [defaults setBool:YES forKey:kMigrationFlagKey];
        } else {
            os_log_error(migration_log(), "reKey failed - will retry on next launch");
        }
    } @catch (NSException *exception) {
        os_log_error(migration_log(), "Migration error: %{public}@ - %{public}@", exception.name, exception.reason);
    }
}

+ (NSString *)initializeMMKV {
    NSString *appGroup = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"AppGroup"];
    if (!appGroup) return nil;

    NSURL *groupURL = [[NSFileManager defaultManager] containerURLForSecurityApplicationGroupIdentifier:appGroup];
    if (!groupURL) return nil;

    NSString *mmkvPath = [[groupURL path] stringByAppendingPathComponent:@"mmkv"];
    [[NSFileManager defaultManager] createDirectoryAtPath:mmkvPath
                              withIntermediateDirectories:YES
                                               attributes:nil
                                                    error:nil];
    return mmkvPath;
}

@end
