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
    
    resolve(@{@"reset": @YES});
}

@end

