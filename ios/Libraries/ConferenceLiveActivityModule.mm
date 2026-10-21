#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

#import <SSLPinning/SSLPinning.h>

@interface ConferenceLiveActivityModule : RCTEventEmitter <NativeConferenceLiveActivitySpec>
@end

@interface ConferenceLiveActivityLabels : NSObject
- (instancetype _Nonnull)initWithMute:(NSString * _Nonnull)mute
                               unmute:(NSString * _Nonnull)unmute
                                leave:(NSString * _Nonnull)leave;
@end

@interface ConferenceLiveActivityManager : NSObject
+ (void)startWithTitle:(NSString * _Nonnull)title
            micEnabled:(BOOL)micEnabled
                labels:(ConferenceLiveActivityLabels * _Nonnull)labels;
+ (void)updateWithMicEnabled:(BOOL)micEnabled labels:(ConferenceLiveActivityLabels * _Nonnull)labels;
+ (void)endAll;
+ (void)setActionHandler:(void (^ _Nullable)(NSString * _Nonnull))handler;
@end

static NSString *const ConferenceNotificationActionEvent = @"ConferenceNotificationAction";

template <typename Labels>
static ConferenceLiveActivityLabels *ActivityLabels(Labels &labels) {
    return [[ConferenceLiveActivityLabels alloc] initWithMute:labels.mute()
                                                       unmute:labels.unmute()
                                                        leave:labels.leave()];
}

@implementation ConferenceLiveActivityModule

RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup {
    return NO;
}

- (instancetype)init {
    if (self = [super init]) {
        [ConferenceLiveActivityManager endAll];
    }
    return self;
}

- (NSArray<NSString *> *)supportedEvents {
    return @[ConferenceNotificationActionEvent];
}

- (void)startObserving {
    __weak ConferenceLiveActivityModule *weakSelf = self;
    [ConferenceLiveActivityManager setActionHandler:^(NSString *action) {
        [weakSelf sendEventWithName:ConferenceNotificationActionEvent body:action];
    }];
}

- (void)stopObserving {
    [ConferenceLiveActivityManager setActionHandler:nil];
}

- (void)startConferenceLiveActivity:(NSString *)title
                         micEnabled:(BOOL)micEnabled
                             labels:(JS::NativeConferenceLiveActivity::SpecStartConferenceLiveActivityLabels &)labels {
    [ConferenceLiveActivityManager startWithTitle:title micEnabled:micEnabled labels:ActivityLabels(labels)];
}

- (void)updateConferenceLiveActivity:(BOOL)micEnabled
                              labels:(JS::NativeConferenceLiveActivity::SpecUpdateConferenceLiveActivityLabels &)labels {
    [ConferenceLiveActivityManager updateWithMicEnabled:micEnabled labels:ActivityLabels(labels)];
}

- (void)endConferenceLiveActivity {
    [ConferenceLiveActivityManager endAll];
}

- (void)addListener:(NSString *)eventName {
    [super addListener:eventName];
}

- (void)removeListeners:(double)count {
    [super removeListeners:count];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
    return std::make_shared<facebook::react::NativeConferenceLiveActivitySpecJSI>(params);
}

@end
