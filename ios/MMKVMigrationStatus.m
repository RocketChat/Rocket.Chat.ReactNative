//
//  MMKVMigrationStatus.m
//  RocketChatRN
//
//  Exposes migration status to JavaScript for debugging
//

#import "MMKVMigrationStatus.h"

@implementation MMKVMigrationStatus

RCT_EXPORT_MODULE(MMKVMigrationStatus)

+ (BOOL)requiresMainQueueSetup {
    return NO;
}

RCT_EXPORT_METHOD(getMigrationStatus:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
    
    NSDictionary *status = @{
        @"completed": @([defaults boolForKey:@"MMKV_MIGRATION_COMPLETED"]),
        @"timestamp": [defaults objectForKey:@"MMKV_MIGRATION_TIMESTAMP"] ?: @"",
        @"keysMigrated": [defaults objectForKey:@"MMKV_MIGRATION_KEYS_COUNT"] ?: @0,
        @"bundleId": [[NSBundle mainBundle] bundleIdentifier] ?: @""
    };
    
    resolve(status);
}

RCT_EXPORT_METHOD(resetMigration:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
    [defaults setBool:NO forKey:@"MMKV_MIGRATION_COMPLETED"];
    [defaults removeObjectForKey:@"MMKV_MIGRATION_TIMESTAMP"];
    [defaults removeObjectForKey:@"MMKV_MIGRATION_KEYS_COUNT"];
    [defaults synchronize];
    
    NSLog(@"[MMKVMigrationStatus] Migration flags reset. App needs to restart for re-migration.");
    
    resolve(@{@"reset": @YES});
}

RCT_EXPORT_METHOD(checkStorageHealth:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    @try {
        NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
        BOOL migrationCompleted = [defaults boolForKey:@"MMKV_MIGRATION_COMPLETED"];
        NSNumber *keysMigrated = [defaults objectForKey:@"MMKV_MIGRATION_KEYS_COUNT"];
        
        // Check if we have a problematic state: migration complete but 0 keys
        BOOL isProblemState = migrationCompleted && ([keysMigrated intValue] == 0 || !keysMigrated);
        
        NSDictionary *health = @{
            @"migrationCompleted": @(migrationCompleted),
            @"keysMigrated": keysMigrated ?: @0,
            @"isProblemState": @(isProblemState),
            @"recommendation": isProblemState 
                ? @"Migration may have failed to find old data. Consider forcing re-migration or user re-login."
                : @"Storage appears healthy"
        };
        
        resolve(health);
    } @catch (NSException *exception) {
        reject(@"ERROR", exception.reason, nil);
    }
}

@end

