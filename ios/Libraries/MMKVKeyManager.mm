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
#import "../Shared/RocketChat/MMKVBridge.h"

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
    @try {
        NSString *mmkvPath = [self initializeMMKV];
        if (!mmkvPath) {
            Logger(@"Failed to initialize MMKV path");
            return;
        }

        SecureStorage *secureStorage = [[SecureStorage alloc] init];
        NSString *alias = toHex(@"com.MMKV.default");
        NSString *password = [secureStorage getSecureKey:alias];

        if (!password || password.length == 0) {
            // Fresh install - generate a new key
            password = [[NSUUID UUID] UUIDString];
            [secureStorage setSecureKey:alias value:password options:nil];
            Logger(@"Generated new MMKV encryption key");
        } else {
            Logger(@"Existing MMKV encryption key found");
        }

        // Verify MMKV can be opened with this key
        NSData *cryptKey = [password dataUsingEncoding:NSUTF8StringEncoding];
        MMKVBridge *mmkv = [[MMKVBridge alloc] initWithID:@"default"
                                                cryptKey:cryptKey
                                                rootPath:mmkvPath];

        if (mmkv) {
            NSUInteger keyCount = [mmkv count];
            Logger(@"MMKV initialized with encryption, %lu keys found", (unsigned long)keyCount);
        } else {
            Logger(@"MMKV instance is nil after initialization");
        }
    } @catch (NSException *exception) {
        Logger(@"MMKV initialization error: %@ - %@", exception.name, exception.reason);
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

