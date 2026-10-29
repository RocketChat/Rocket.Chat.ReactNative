#import "RCTWatchModule.h"
#import <WatchConnectivity/WCSession.h>
#import "Shared/RocketChat/MMKVBridge.h"

@interface MMKVBridge (WatchQuickReplies)
+ (MMKVBridge * _Nonnull)build;
- (NSArray<NSString *> * _Nonnull)watchQuickRepliesFor:(NSString * _Nonnull)server;
@end

@interface RCTWatchModule ()
@property(nonatomic, strong) WCSession *session;
@property(nonatomic, strong) MMKVBridge *mmkv;
@end

@implementation RCTWatchModule

#pragma mark - initialisation

- (id)init {
    if (self = [super init]) {
        _session = WCSession.defaultSession;
        _mmkv = [MMKVBridge build];
    }
    return self;
}

#pragma mark - turbo modules register
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
    return std::make_shared<facebook::react::NativeWatchModuleSpecJSI>(params);
}

+ (NSString *)moduleName {
    return @"WatchModule";
}

#pragma mark - spec methods (declared in spec)
- (NSString *)syncQuickReplies:(NSString *)server {
    if (![WCSession isSupported] || !_session.isWatchAppInstalled) {
        return @"[ERROR]: WatchApp not supported or not installed";
    }

    if (_session.activationState != WCSessionActivationStateActivated) {
        return @"[ERROR]: Watch session not activated";
    }

    NSArray<NSString *> *replies = [_mmkv watchQuickRepliesFor:server];
    NSError *error = nil;
    BOOL success = [_session updateApplicationContext:@{
        @"quickReplies" : replies,
        @"server" : server,
        @"_t" : [NSUUID UUID].UUIDString
    }
                                                error:&error];

    if (!success) {
        return [NSString stringWithFormat:@"[ERROR]: %@", error.localizedDescription ?: @"Unknown Watch error"];
    }

    return @"SUCCESS";
}

- (nonnull NSNumber *)isWatchAppInstalled {
    return @([WCSession isSupported] && _session.isWatchAppInstalled);
}
@end
