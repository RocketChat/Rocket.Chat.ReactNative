#import "RCTWatchModule.h"
#import <WatchConnectivity/WCSession.h>

@interface RCTWatchModule ()
@property(nonatomic, strong) WCSession *session;
@end

@implementation RCTWatchModule

- (id)init {
    if (self = [super init]) {
        _session = WCSession.defaultSession;
    }
    return self;
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
    return std::make_shared<facebook::react::NativeWatchModuleSpecJSI>(params);
}

- (BOOL)isSupported {
    if ([WCSession isSupported]) {
        return YES;
    } else {
        return NO;
    }
}

- (void)syncQuickReplies {
    NSLog(@"syncQuickReplies code");
}

- (NSString *)testModule {
    return @"test succeed";
}

- (nonnull NSNumber *)isWatchSupported {
    if (![self isSupported]) {
        return @(0);
    } else {
        return @(1);
    }
}

- (nonnull NSNumber *)isWatchPaired {
    if (![self isSupported]) {
        return @(0);
    } else {
        BOOL available = [_session isPaired];
        return @(available);
    }
}

- (nonnull NSNumber *)isWatchAppInstalled {
    if (![self isSupported]) {
        return @(0);
    } else {
        BOOL available = [_session isWatchAppInstalled];
        return @(available);
    }
}


+ (NSString *)moduleName {
    return @"WatchModule";
}

@end
