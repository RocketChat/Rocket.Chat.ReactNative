#import <UIKit/UIKit.h>
#import <React/RCTBridgeModule.h>
#import <SSLPinning/SSLPinning.h>

#include <atomic>

@interface PrivacyCover : NSObject <NativePrivacyCoverSpec>
@end

@implementation PrivacyCover {
  BOOL _enabled;
  NSInteger _coverToken;
  std::atomic<NSInteger> _activatedToken;
  NSInteger _releasedToken;
  UIView *_coverView;
}

RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (instancetype)init
{
  if (self = [super init]) {
    _enabled = NO;
    _coverToken = 0;
    _activatedToken = 0;
    _releasedToken = 0;
    NSNotificationCenter *center = [NSNotificationCenter defaultCenter];
    [center addObserver:self selector:@selector(sceneWillDeactivate:) name:UISceneWillDeactivateNotification object:nil];
    [center addObserver:self selector:@selector(sceneDidEnterBackground:) name:UISceneDidEnterBackgroundNotification object:nil];
    [center addObserver:self selector:@selector(sceneDidActivate:) name:UISceneDidActivateNotification object:nil];
  }
  return self;
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)sceneWillDeactivate:(NSNotification *)notification
{
  if (_enabled) {
    [self showCoverInScene:notification.object];
  }
}

- (void)sceneDidEnterBackground:(NSNotification *)notification
{
  _coverToken += 1;
  if (_enabled) {
    [self showCoverInScene:notification.object];
  } else {
    _releasedToken = _coverToken;
  }
}

- (void)sceneDidActivate:(NSNotification *)notification
{
  _activatedToken = _coverToken;
  if (_releasedToken == _coverToken) {
    [self hideCover];
  }
}

- (void)setEnabled:(BOOL)enabled
{
  _enabled = enabled;
}

- (NSNumber *)getCoverToken
{
  return @(_activatedToken.load());
}

- (void)releaseCover:(double)token
{
  if ((NSInteger)token != _coverToken) {
    return;
  }
  _releasedToken = (NSInteger)token;
  if (UIApplication.sharedApplication.applicationState == UIApplicationStateActive) {
    [self hideCover];
  }
}

- (void)showCoverInScene:(id)scene
{
  if (_coverView != nil || ![scene isKindOfClass:[UIWindowScene class]]) {
    return;
  }
  UIWindow *window = ((UIWindowScene *)scene).keyWindow;
  if (window == nil) {
    return;
  }
  UIView *coverView = [self makeCoverView];
  coverView.frame = window.bounds;
  coverView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
  coverView.accessibilityViewIsModal = YES;
  [window addSubview:coverView];
  _coverView = coverView;
}

- (UIView *)makeCoverView
{
  return [[UIStoryboard storyboardWithName:@"LaunchScreen" bundle:nil] instantiateInitialViewController].view;
}

- (void)hideCover
{
  [_coverView removeFromSuperview];
  _coverView = nil;
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativePrivacyCoverSpecJSI>(params);
}

@end
