//
//  MMKVKeyManager.mm
//  RocketChatRN
//
//  MMKV Key Manager - Ensures encryption key exists for MMKV storage
//  For existing users: reads the key from Keychain
//  For fresh installs: generates a new key and stores it in Keychain
//

#import "MMKVKeyManager.h"
#import "SecureStorage.h"
#import <MMKV/MMKV.h>

static NSString *toHex(NSString *str) {
    if (!str) return @"";

    const char *utf8 = [str UTF8String];
    NSMutableString *hex = [NSMutableString string];

    while (*utf8) {
        [hex appendFormat:@"%02X", (unsigned char)*utf8++];
    }

    return [hex lowercaseString];
}

static void Logger(NSString *format, ...) {
    va_list args;
    va_start(args, format);
    NSString *message = [[NSString alloc] initWithFormat:format arguments:args];
    va_end(args);
    fprintf(stderr, "[MMKVKeyManager] %s\n", [message UTF8String]);
}

@implementation MMKVKeyManager

+ (void)initialize {
    if (self != [MMKVKeyManager class]) return;

    @try {
        NSString *mmkvPath = [self initializeMMKV];
        if (!mmkvPath) {
            Logger(@"Failed to initialize MMKV path");
            return;
        }

        // --- CRITICAL CHANGE ---
        // In v4, for App Groups, you must set the 2nd parameter (groupDir).
        // Signature: initializeMMKV:(NSString*)rootDir groupDir:(NSString*)groupDir logLevel:(MMKVLogLevel)logLevel
        [MMKV initializeMMKV:nil groupDir:mmkvPath logLevel:MMKVLogInfo];

        SecureStorage *secureStorage = [[SecureStorage alloc] init];
        NSString *alias = toHex(@"com.MMKV.default");
        NSString *password = [secureStorage getSecureKey:alias];

        if (!password || password.length == 0) {
            password = [[NSUUID UUID] UUIDString];
            [secureStorage setSecureKey:alias value:password options:nil];
            Logger(@"Generated new MMKV encryption key");
        }

        // Verify MMKV can be opened with this key
        NSData *cryptKey = [password dataUsingEncoding:NSUTF8StringEncoding];

        // Ensure we use MMKVMultiProcess to match the JS side
        MMKV *mmkv = [MMKV mmkvWithID:@"default" cryptKey:cryptKey mode:MMKVMultiProcess];

        if (mmkv) {
            Logger(@"MMKV initialized successfully. Keys: %lu", (unsigned long)[[mmkv allKeys] count]);
        }
    } @catch (NSException *exception) {
        Logger(@"MMKV initialization error: %@ - %@", exception.name, exception.reason);
    }
}

+ (NSString *)initializeMMKV {
    NSString *appGroup = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"AppGroupIdentifier"] 
                         ?: [[NSBundle mainBundle] objectForInfoDictionaryKey:@"AppGroup"];
    
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

