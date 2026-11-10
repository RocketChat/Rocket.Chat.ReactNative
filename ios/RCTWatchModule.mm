#import "RCTWatchModule.h"
#import <WatchConnectivity/WCSession.h>
#import "Shared/RocketChat/MMKVBridge.h"

@interface MMKVBridge (WatchQuickReplies)
+ (MMKVBridge * _Nonnull)build;
+ (NSString * _Nonnull)watchQuickRepliesKeyFor:(NSString * _Nonnull)server;
- (NSDictionary<NSString *, NSArray<NSString *> *> * _Nonnull)allWatchQuickReplies;
@end

@interface RCTWatchModule ()
@property(nonatomic, strong) WCSession *session;
@property(nonatomic, strong) MMKVBridge *mmkv;
@end

@implementation RCTWatchModule

- (id)init {
    if (self = [super init]) {
        _session = WCSession.defaultSession;
        _mmkv = [MMKVBridge build];
    }
    return self;
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
    return std::make_shared<facebook::react::NativeWatchModuleSpecJSI>(params);
}

+ (NSString *)moduleName {
    return @"WatchModule";
}

- (NSString * _Nullable)syncQuickReplies {
    if (_session.activationState != WCSessionActivationStateActivated) {
        return @"Watch session not activated";
    }

    NSError *error = nil;
    BOOL success = [_session updateApplicationContext:@{@"quickReplies" : [_mmkv allWatchQuickReplies]} error:&error];

    if (!success) {
        return error.localizedDescription ?: @"Unknown Watch error";
    }

    return nil;
}

- (NSString *)getQuickRepliesKey:(NSString *)server {
    return [MMKVBridge watchQuickRepliesKeyFor:server];
}

- (nonnull NSNumber *)isWatchAppInstalled {
    return @([WCSession isSupported] && _session.isWatchAppInstalled);
}
@end
