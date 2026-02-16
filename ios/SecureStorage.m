#import <React/RCTBridgeModule.h>
#import "SecureStorage.h"
#import <UIKit/UIKit.h>

@implementation SecureStorage : NSObject

RCT_EXPORT_MODULE(SecureStorage);

+ (BOOL)requiresMainQueueSetup
{
    return NO;
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(getSecureKeySync:(NSString *)key)
{
    NSString *value = [self getSecureKey:key];
    return value ? value : [NSNull null];
}

NSString *serviceName = nil;

- (void) setSecureKey: (NSString *)key value:(NSString *)value
              options: (NSDictionary *)options
{
    @try {
        [self handleAppUninstallation];
        BOOL status = [self createKeychainValue: value forIdentifier: key options: options];
        if (!status) {
            [self updateKeychainValue: value forIdentifier: key options: options];
        }
    }
    @catch (NSException *exception) {
        // Handle exception
    }
}

- (NSString *) getSecureKey:(NSString *)key
{
    @try {
        [self handleAppUninstallation];
        NSString *value = [self searchKeychainCopyMatching:key];
        if (value == nil) {
            return NULL;
        } else {
            return value;
        }
    }
    @catch (NSException *exception) {
        return NULL;
    }
}

- (BOOL) deleteSecureKey:(NSString *)key
{
    @try {
        return [self deleteKeychainValue:key];
    }
    @catch (NSException *exception) {
        return NO;
    }
}

- (NSMutableDictionary *)newSearchDictionary:(NSString *)identifier {
    NSMutableDictionary *searchDictionary = [[NSMutableDictionary alloc] init];

    // this value is shared by main app and extensions, so, is the best to be used here
    serviceName = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"AppGroup"];
    
    if(serviceName == nil){
        serviceName = [[NSBundle mainBundle] bundleIdentifier];
    }
    
    [searchDictionary setObject:(id)kSecClassGenericPassword forKey:(id)kSecClass];
    
    NSData *encodedIdentifier = [identifier dataUsingEncoding:NSUTF8StringEncoding];
    [searchDictionary setObject:encodedIdentifier forKey:(id)kSecAttrGeneric];
    [searchDictionary setObject:encodedIdentifier forKey:(id)kSecAttrAccount];
    [searchDictionary setObject:serviceName forKey:(id)kSecAttrService];
    
    return searchDictionary;
}

- (NSString *)searchKeychainCopyMatching:(NSString *)identifier {
    NSMutableDictionary *searchDictionary = [self newSearchDictionary:identifier];
    
    // Add search attributes
    [searchDictionary setObject:(id)kSecMatchLimitOne forKey:(id)kSecMatchLimit];
    
    // Add search return types
    [searchDictionary setObject:(id)kCFBooleanTrue forKey:(id)kSecReturnData];
    
    NSDictionary *found = nil;
    CFTypeRef result = NULL;
    OSStatus status = SecItemCopyMatching((CFDictionaryRef)searchDictionary,
                                          (CFTypeRef *)&result);
    
    NSString *value = nil;
    found = (__bridge NSDictionary*)(result);
    if (found) {
        value = [[NSString alloc] initWithData:found encoding:NSUTF8StringEncoding];
    }
    return value;
}

- (BOOL)createKeychainValue:(NSString *)value forIdentifier:(NSString *)identifier options: (NSDictionary * __nullable)options {
    CFStringRef accessibleVal = _accessibleValue(options);
    NSMutableDictionary *dictionary = [self newSearchDictionary:identifier];
    
    NSData *valueData = [value dataUsingEncoding:NSUTF8StringEncoding];
    [dictionary setObject:valueData forKey:(id)kSecValueData];
    dictionary[(__bridge NSString *)kSecAttrAccessible] = (__bridge id)accessibleVal;
    
    OSStatus status = SecItemAdd((CFDictionaryRef)dictionary, NULL);
    
    if (status == errSecSuccess) {
        return YES;
    }
    return NO;
}

- (BOOL)updateKeychainValue:(NSString *)password forIdentifier:(NSString *)identifier options:(NSDictionary * __nullable)options {
    CFStringRef accessibleVal = _accessibleValue(options);
    NSMutableDictionary *searchDictionary = [self newSearchDictionary:identifier];
    NSMutableDictionary *updateDictionary = [[NSMutableDictionary alloc] init];
    NSData *passwordData = [password dataUsingEncoding:NSUTF8StringEncoding];
    [updateDictionary setObject:passwordData forKey:(id)kSecValueData];
    updateDictionary[(__bridge NSString *)kSecAttrAccessible] = (__bridge id)accessibleVal;
    OSStatus status = SecItemUpdate((CFDictionaryRef)searchDictionary,
                                    (CFDictionaryRef)updateDictionary);
    
    if (status == errSecSuccess) {
        return YES;
    }
    return NO;
}

- (BOOL)deleteKeychainValue:(NSString *)identifier {
    NSMutableDictionary *searchDictionary = [self newSearchDictionary:identifier];
    OSStatus status = SecItemDelete((CFDictionaryRef)searchDictionary);
    if (status == errSecSuccess) {
        return YES;
    }
    return NO;
}

- (void)handleAppUninstallation
{
    [[NSUserDefaults standardUserDefaults] synchronize];
}

CFStringRef _accessibleValue(NSDictionary *options)
{
    if (options && options[@"accessible"] != nil) {
        NSDictionary *keyMap = @{
            @"AccessibleWhenUnlocked": (__bridge NSString *)kSecAttrAccessibleWhenUnlocked,
            @"AccessibleAfterFirstUnlock": (__bridge NSString *)kSecAttrAccessibleAfterFirstUnlock,
            @"AccessibleAlways": (__bridge NSString *)kSecAttrAccessibleAlways,
            @"AccessibleWhenPasscodeSetThisDeviceOnly": (__bridge NSString *)kSecAttrAccessibleWhenPasscodeSetThisDeviceOnly,
            @"AccessibleWhenUnlockedThisDeviceOnly": (__bridge NSString *)kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
            @"AccessibleAfterFirstUnlockThisDeviceOnly": (__bridge NSString *)kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly,
            @"AccessibleAlwaysThisDeviceOnly": (__bridge NSString *)kSecAttrAccessibleAlwaysThisDeviceOnly
        };
        
        NSString *result = keyMap[options[@"accessible"]];
        if (result) {
            return (__bridge CFStringRef)result;
        }
    }
    return kSecAttrAccessibleAfterFirstUnlock;
}

// Helper function to convert string to hex (same as react-native-mmkv-storage)
NSString* toHex(NSString *input) {
    NSData *data = [input dataUsingEncoding:NSUTF8StringEncoding];
    NSMutableString *hexString = [NSMutableString stringWithCapacity:data.length * 2];
    const unsigned char *bytes = data.bytes;
    for (NSUInteger i = 0; i < data.length; i++) {
        [hexString appendFormat:@"%02x", bytes[i]];
    }
    return hexString;
}

/**
 * Synchronous method to get the MMKV encryption key.
 * - For existing users: returns the key stored in Keychain
 * - For fresh installs: generates a new key, stores it, and returns it
 * Used by JavaScript to initialize MMKV with the same encryption key as native code.
 */
RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(getMMKVEncryptionKey)
{
    @try {
        NSString *alias = toHex(@"com.MMKV.default");
        NSString *key = [self getSecureKey:alias];
        
        if (key == nil || key.length == 0) {
            // Fresh install - generate a new key
            key = [[NSUUID UUID] UUIDString];
            [self setSecureKey:alias value:key options:nil];
            NSLog(@"[SecureStorage] Generated new MMKV encryption key");
        }
        
        return key;
    }
    @catch (NSException *exception) {
        NSLog(@"[SecureStorage] Error getting MMKV encryption key: %@", exception.reason);
        return [NSNull null];
    }
}

@end
