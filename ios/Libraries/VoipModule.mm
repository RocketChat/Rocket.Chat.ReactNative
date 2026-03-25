#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <PushKit/PushKit.h>

#import <RocketChatSpecs/RocketChatSpecs.h>

@interface VoipModule : RCTEventEmitter <NativeVoipSpec>
@end

@interface VoipService : NSObject
+ (void)voipRegistration;
+ (NSDictionary * _Nullable)getInitialEvents;
+ (void)clearInitialEvents;
+ (NSString * _Nonnull)getLastVoipToken;
+ (void)stopDDPClient;
@end

@implementation VoipModule {
    BOOL _hasListeners;
    NSMutableArray *_delayedEvents;
}

RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup {
    return YES;
}

- (instancetype)init {
    if (self = [super init]) {
        _hasListeners = NO;
        _delayedEvents = [NSMutableArray array];
    }
    return self;
}

- (NSArray<NSString *> *)supportedEvents {
    return @[@"VoipPushTokenRegistered", @"VoipAcceptFailed"];
}

- (void)startObserving {
    _hasListeners = YES;
    
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(handleVoipTokenRegistered:)
                                                 name:@"VoipPushTokenRegistered"
                                               object:nil];

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(handleVoipAcceptFailed:)
                                                 name:@"VoipAcceptFailed"
                                               object:nil];

    // Send any delayed events
    for (NSDictionary *event in _delayedEvents) {
        NSString *name = event[@"name"];
        id data = event[@"data"];
        if (name && data) {
            [self sendEventWithName:name body:data];
        }
    }
    [_delayedEvents removeAllObjects];
}

- (void)stopObserving {
    _hasListeners = NO;
    [[NSNotificationCenter defaultCenter] removeObserver:self];
}

// Handler for Token Registration
- (void)handleVoipTokenRegistered:(NSNotification *)notification {
    [self sendEventWrapper:@"VoipPushTokenRegistered" body:notification.userInfo];
}

- (void)handleVoipAcceptFailed:(NSNotification *)notification {
    [self sendEventWrapper:@"VoipAcceptFailed" body:notification.userInfo];
}

- (void)sendEventWrapper:(NSString *)name body:(id)body {
    if (_hasListeners) {
        [self sendEventWithName:name body:body];
    } else {
        [_delayedEvents addObject:@{@"name": name, @"data": body ?: [NSNull null]}];
    }
}

#pragma mark - NativeVoipSpec methods

- (void)registerVoipToken {
    dispatch_async(dispatch_get_main_queue(), ^{
        [VoipService voipRegistration];
    });
}

- (NSDictionary * _Nullable)getInitialEvents {
    return [VoipService getInitialEvents];
}

- (void)clearInitialEvents {
    [VoipService clearInitialEvents];
}

- (NSString * _Nonnull)getLastVoipToken {
    return [VoipService getLastVoipToken];
}

- (void)stopNativeDDPClient {
    [VoipService stopDDPClient];
}

// TurboModule codegen calls these on VoipModule directly. Empty implementations replaced
// RCTEventEmitter's logic, so startObserving/stopObserving never ran and no events reached JS.
- (void)addListener:(NSString *)eventName {
    [super addListener:eventName];
}

- (void)removeListeners:(double)count {
    [super removeListeners:count];
}

#pragma mark - TurboModule

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
    return std::make_shared<facebook::react::NativeVoipSpecJSI>(params);
}

@end
