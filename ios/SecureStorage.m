//
//  SecureStorage.m
//  RocketChatRN
//
//  Extracted from react-native-mmkv-storage for standalone use
//  Manages encryption keys in iOS Keychain
//

#import "SecureStorage.h"
#import <Security/Security.h>
#import <UIKit/UIKit.h>

static NSString *serviceName = nil;

@implementation SecureStorage

- (NSString *)getSecureKey:(NSString *)key {
    @try {
        [self handleAppUninstallation];
        NSString *value = [self searchKeychainCopyMatching:key];
        
        // Removed the dispatch_sync block that was causing issues
        // as per the patch from react-native-mmkv-storage+12.0.0.patch
        
        if (value == nil) {
            NSString* errorMessage = @"key does not present";
            return nil;
        }
        
        return value;
    }
    @catch (NSException *exception) {
        return nil;
    }
}

- (BOOL)setSecureKey:(NSString *)key value:(NSString *)value {
    @try {
        [self handleAppUninstallation];
        
        NSMutableDictionary *dictionary = [self newSearchDictionary:key];
        
        // Delete any existing key before inserting
        SecItemDelete((__bridge CFDictionaryRef)dictionary);
        
        // Set the new value
        NSData *valueData = [value dataUsingEncoding:NSUTF8StringEncoding];
        [dictionary setObject:valueData forKey:(__bridge id)kSecValueData];
        [dictionary setObject:(__bridge id)kSecAttrAccessibleAfterFirstUnlock forKey:(__bridge id)kSecAttrAccessible];
        
        OSStatus status = SecItemAdd((__bridge CFDictionaryRef)dictionary, NULL);
        
        if (status == errSecSuccess) {
            return YES;
        }
        
        return NO;
    }
    @catch (NSException *exception) {
        return NO;
    }
}

- (BOOL)secureKeyExists:(NSString *)key {
    NSString *value = [self getSecureKey:key];
    return value != nil;
}

- (BOOL)removeSecureKey:(NSString *)key {
    @try {
        NSMutableDictionary *dictionary = [self newSearchDictionary:key];
        OSStatus status = SecItemDelete((__bridge CFDictionaryRef)dictionary);
        
        if (status == errSecSuccess) {
            return YES;
        }
        
        return NO;
    }
    @catch (NSException *exception) {
        return NO;
    }
}

- (NSString *)searchKeychainCopyMatching:(NSString *)identifier {
    NSMutableDictionary *searchDictionary = [self newSearchDictionary:identifier];
    
    // Add search attributes
    [searchDictionary setObject:(__bridge id)kSecMatchLimitOne forKey:(__bridge id)kSecMatchLimit];
    [searchDictionary setObject:@YES forKey:(__bridge id)kSecReturnData];
    
    CFTypeRef foundDict = NULL;
    OSStatus status = SecItemCopyMatching((__bridge CFDictionaryRef)searchDictionary, &foundDict);
    
    if (status == noErr) {
        NSData *data = (__bridge_transfer NSData *)foundDict;
        NSString *value = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
        return value;
    }
    
    return nil;
}

- (NSMutableDictionary *)newSearchDictionary:(NSString *)identifier {
    NSMutableDictionary *searchDictionary = [[NSMutableDictionary alloc] init];
    
    // Use AppGroup as serviceName for sharing between main app and extensions
    // This matches the patch applied to react-native-mmkv-storage
    serviceName = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"AppGroup"];
    
    if(serviceName == nil){
        serviceName = [[NSBundle mainBundle] bundleIdentifier];
    }
    
    [searchDictionary setObject:(__bridge id)kSecClassGenericPassword forKey:(__bridge id)kSecClass];
    [searchDictionary setObject:serviceName forKey:(__bridge id)kSecAttrService];
    [searchDictionary setObject:identifier forKey:(__bridge id)kSecAttrAccount];
    
    return searchDictionary;
}

- (void)handleAppUninstallation {
    // Check if this is the first launch after installation
    NSString *key = @"RNMMKVStorage_Installed";
    BOOL hasBeenLaunched = [[NSUserDefaults standardUserDefaults] boolForKey:key];
    
    if (!hasBeenLaunched) {
        // Clear all keychain items for this app
        [self clearAllKeychainItems];
        [[NSUserDefaults standardUserDefaults] setBool:YES forKey:key];
        [[NSUserDefaults standardUserDefaults] synchronize];
    }
}

- (void)clearAllKeychainItems {
    NSArray *secItemClasses = @[
        (__bridge id)kSecClassGenericPassword,
        (__bridge id)kSecClassInternetPassword,
        (__bridge id)kSecClassCertificate,
        (__bridge id)kSecClassKey,
        (__bridge id)kSecClassIdentity
    ];
    
    for (id secItemClass in secItemClasses) {
        NSDictionary *spec = @{(__bridge id)kSecClass: secItemClass};
        SecItemDelete((__bridge CFDictionaryRef)spec);
    }
}

@end

