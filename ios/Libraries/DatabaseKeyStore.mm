#import <React/RCTBridgeModule.h>

// Forward declaration of the Swift Keychain helper. Same translation-unit-only
// declaration VoipModule.mm uses for VoipService — the symbol links from the
// same target at link time; importing the generated -Swift.h here is unnecessary.
@interface DatabaseKeyStore : NSObject
+ (NSString * _Nullable)readAccount:(NSString *)account error:(NSError * _Nullable * _Nullable)error;
+ (BOOL)write:(NSString *)account value:(NSString *)value;
+ (void)delete:(NSString *)account;
@end

@interface DatabaseKeyStoreModule : NSObject <NativeDatabaseKeyStoreSpec>
@end

@implementation DatabaseKeyStoreModule

RCT_EXPORT_MODULE(DatabaseKeyStoreModule)

+ (BOOL)requiresMainQueueSetup {
    return NO;
}

- (void)getItem:(NSString *)key
        resolve:(RCTPromiseResolveBlock)resolve
         reject:(RCTPromiseRejectBlock)reject {
    NSError *err = nil;
    NSString *value = [DatabaseKeyStore readAccount:key error:&err];
    if (err != nil) {
        reject(@"KEYCHAIN_READ_ERROR", @"Failed to read key from Keychain", err);
        return;
    }
    // Resolve explicit JS null (not nil) on a genuine miss: nil bridges to `undefined`,
    // which breaks the `Promise<string | null>` contract and the `!== null` check
    // in getOrCreateDatabaseKey. Android already resolves null on a miss.
    resolve(value ?: (id)[NSNull null]);
}

- (void)setItem:(NSString *)key
          value:(NSString *)value
        resolve:(RCTPromiseResolveBlock)resolve
         reject:(RCTPromiseRejectBlock)reject {
    BOOL ok = [DatabaseKeyStore write:key value:value];
    if (ok) {
        resolve(nil);
    } else {
        reject(@"KEYCHAIN_WRITE_ERROR", @"Failed to store item in Keychain", nil);
    }
}

- (void)removeItem:(NSString *)key
           resolve:(RCTPromiseResolveBlock)resolve
            reject:(RCTPromiseRejectBlock)reject {
    [DatabaseKeyStore delete:key];
    resolve(nil);
}

#pragma mark - TurboModule

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
    return std::make_shared<facebook::react::NativeDatabaseKeyStoreSpecJSI>(params);
}

@end
