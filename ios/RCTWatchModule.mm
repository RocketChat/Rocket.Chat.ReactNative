#import "RCTWatchModule.h"
#import <WatchConnectivity/WCSession.h>

@interface RCTWatchModule ()
@property(nonatomic, strong) WCSession *session;
@end

@implementation RCTWatchModule

#pragma mark - initialisation

- (id)init {
    if (self = [super init]) {
        // activated by WatchConnection in AppDelegate
        _session = WCSession.defaultSession;
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
- (NSString *)syncQuickReplies:(NSString *)server replies:(NSArray *)replies {
    if (![WCSession isSupported] || !_session.isWatchAppInstalled) {
        return @"[ERROR]: WatchApp not supported or not installed";
    }

    if (_session.activationState != WCSessionActivationStateActivated) {
        return @"[ERROR]: Watch session not activated";
    }

    NSError *error = nil;
    BOOL success = [_session updateApplicationContext:@{
        @"quickReplies" : replies,
        @"server" : server,
        // the watch only receives a context that differs from the last one
        @"_t" : [NSUUID UUID].UUIDString
    }
                                                error:&error];

    if (!success) {
        return [NSString stringWithFormat:@"[ERROR]: %@", error.localizedDescription ?: @"Unknown Watch error"];
    }

    return @"SUCCESS";
}

- (nonnull NSNumber *)isWatchSupported {
    return @([WCSession isSupported]);
}

- (nonnull NSNumber *)isWatchPaired {
    return @([WCSession isSupported] && _session.isPaired);
}

- (nonnull NSNumber *)isWatchAppInstalled {
    return @([WCSession isSupported] && _session.isWatchAppInstalled);
}
@end
