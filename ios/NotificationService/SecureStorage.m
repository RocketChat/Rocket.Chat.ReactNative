//
//  SecureStorage.m
//  NotificationService
//
//  https://github.com/ammarahm-ed/react-native-mmkv-storage/blob/master/ios/SecureStorage.m
//  Refer to /patches/react-native-mmkv-storage+0.3.5.patch

#if __has_include("RCTBridgeModule.h")
#import "RCTBridgeModule.h"
#else
#import <React/RCTBridgeModule.h>
#endif

#import "SecureStorage.h"

@implementation SecureStorage : NSObject

NSString *serviceName;

- (void) setSecureKey: (NSString *)key value:(NSString *)value
              options: (NSDictionary *)options
             callback:(RCTResponseSenderBlock)callback

{
    
    @try {
        
        [self handleAppUninstallation];
        BOOL status = [self createKeychainValue: value forIdentifier: key options: options];
        if (status) {
            callback(@[[NSNull null],@"Key updated successfully" ]);
            
        } else {
            BOOL status = [self updateKeychainValue: value forIdentifier: key options: options];
            if (status) {
                callback(@[[NSNull null],@"Key updated successfully" ]);
            } else {
                callback(@[@"An error occurred", [NSNull null]]);
            }
        }
    }
    @catch (NSException *exception) {
        callback(@[exception.reason, [NSNull null]]);
    }
}

- (NSString *) getSecureKey:(NSString *)key
                   callback:(RCTResponseSenderBlock)callback
{
    @try {
        [self handleAppUninstallation];
        NSString *value = [self searchKeychainCopyMatching:key];
        if (value == nil) {
            NSString* errorMessage = @"key does not present";
            if (callback != NULL) {
                callback(@[errorMessage, [NSNull null]]);
            }
            
            return NULL;
        } else {
            
            if (callback != NULL) {
                callback(@[[NSNull null], value]);
            }
            
            return value;
        }
    }
    @catch (NSException *exception) {
        if (callback != NULL) {
            callback(@[exception.reason, [NSNull null]]);
        }
        return NULL;
    }
    
}

- (bool) secureKeyExists:(NSString *)key
                callback:(RCTResponseSenderBlock)callback
{
    
    @try {
        [self handleAppUninstallation];
        BOOL exists = [self searchKeychainCopyMatchingExists:key];
        if (exists) {
            if (callback != NULL) {
                callback(@[[NSNull null], @true]);
            }
            
            return true;
        } else {
            
            
            if (callback != NULL) {
                callback(@[[NSNull null], @false]);
            }
            return false;
        }
    }
    @catch(NSException *exception) {
        if (callback != NULL) {
            callback(@[exception.reason, [NSNull null]]);
        }
        
        
        return NULL;
    }
}
- (void) removeSecureKey:(NSString *)key
                callback:(RCTResponseSenderBlock)callback
{
    @try {
        BOOL status = [self deleteKeychainValue:key];
        if (status) {
            callback(@[[NSNull null], @"key removed successfully"]);
            
        } else {
            NSString* errorMessage = @"Could not find the key to delete.";
            
            callback(@[errorMessage, [NSNull null]]);
        }
    }
    @catch(NSException *exception) {
        callback(@[exception.reason, [NSNull null]]);
    }
}




- (NSMutableDictionary *)newSearchDictionary:(NSString *)identifier {
    NSMutableDictionary *searchDictionary = [[NSMutableDictionary alloc] init];
    // this value is shared by main app and extensions, so, is the best to be used here
    serviceName = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"AppGroup"];
    
    [searchDictionary setObject:(id)kSecClassGenericPassword forKey:(id)kSecClass];
    
    NSData *encodedIdentifier = [identifier dataUsingEncoding:NSUTF8StringEncoding];
    [searchDictionary setObject:encodedIdentifier forKey:(id)kSecAttrGeneric];
    [searchDictionary setObject:encodedIdentifier forKey:(id)kSecAttrAccount];
    [searchDictionary setObject:serviceName forKey:(id)kSecAttrService];
    
    NSString *keychainGroup = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"KeychainGroup"];
    [searchDictionary setObject:keychainGroup forKey:(id)kSecAttrAccessGroup];
    
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

- (BOOL)searchKeychainCopyMatchingExists:(NSString *)identifier {
    NSMutableDictionary *searchDictionary = [self newSearchDictionary:identifier];
    
    // Add search attributes
    [searchDictionary setObject:(id)kSecMatchLimitOne forKey:(id)kSecMatchLimit];
    
    // Add search return types
    [searchDictionary setObject:(id)kCFBooleanTrue forKey:(id)kSecReturnData];
    
    CFTypeRef result = NULL;
    OSStatus status = SecItemCopyMatching((CFDictionaryRef)searchDictionary,
                                          (CFTypeRef *)&result);
    
    if (status != errSecItemNotFound) {
        return YES;
    }
    return NO;
}

- (BOOL)createKeychainValue:(NSString *)value forIdentifier:(NSString *)identifier options: (NSDictionary * __nullable)options {
    CFStringRef accessible = accessibleValue(options);
    NSMutableDictionary *dictionary = [self newSearchDictionary:identifier];
    
    NSData *valueData = [value dataUsingEncoding:NSUTF8StringEncoding];
    [dictionary setObject:valueData forKey:(id)kSecValueData];
    dictionary[(__bridge NSString *)kSecAttrAccessible] = (__bridge id)accessible;
    
    OSStatus status = SecItemAdd((CFDictionaryRef)dictionary, NULL);
    
    if (status == errSecSuccess) {
        return YES;
    }
    return NO;
}

- (BOOL)updateKeychainValue:(NSString *)password forIdentifier:(NSString *)identifier options:(NSDictionary * __nullable)options {
    
    CFStringRef accessible = accessibleValue(options);
    NSMutableDictionary *searchDictionary = [self newSearchDictionary:identifier];
    NSMutableDictionary *updateDictionary = [[NSMutableDictionary alloc] init];
    NSData *passwordData = [password dataUsingEncoding:NSUTF8StringEncoding];
    [updateDictionary setObject:passwordData forKey:(id)kSecValueData];
    updateDictionary[(__bridge NSString *)kSecAttrAccessible] = (__bridge id)accessible;
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

- (void)clearSecureKeyStore
{
    NSArray *secItemClasses = @[(__bridge id)kSecClassGenericPassword,
                                (__bridge id)kSecAttrGeneric,
                                (__bridge id)kSecAttrAccount,
                                (__bridge id)kSecClassKey,
                                (__bridge id)kSecAttrService];
    for (id secItemClass in secItemClasses) {
        NSDictionary *spec = @{(__bridge id)kSecClass: secItemClass};
        SecItemDelete((__bridge CFDictionaryRef)spec);
    }
}

- (void)handleAppUninstallation
{
    // use app group user defaults to prevent clear when it's share extension
    NSString *suiteName = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"AppGroup"];
    NSUserDefaults *userDefaults = [[NSUserDefaults alloc] initWithSuiteName:suiteName];
    if (![userDefaults boolForKey:@"RnSksIsAppInstalled"]) {
        [self clearSecureKeyStore];
        [userDefaults setBool:YES forKey:@"RnSksIsAppInstalled"];
        [userDefaults synchronize];
    }
}

NSError * secureKeyStoreError(NSString *errMsg)
{
    NSError *error = [NSError errorWithDomain:serviceName code:200 userInfo:@{@"reason": errMsg}];
    return error;
}



CFStringRef accessibleValue(NSDictionary *options)
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

@end

