#import "KeyboardCommandModule.h"
#import <React/RCTLog.h>
#import <UIKit/UIKit.h>

@interface KeyCommandHandler : UIViewController
@property (nonatomic, weak) KeyboardCommandModule *eventEmitter;
@end

@implementation KeyCommandHandler

- (void)loadView {
  self.view = [[UIView alloc] init];
}

- (NSArray<UIKeyCommand *> *)keyCommands {
  return @[
    [UIKeyCommand keyCommandWithInput:@"k"
                         modifierFlags:UIKeyModifierCommand
                                action:@selector(handleCommandK)
                  discoverabilityTitle:@"Search"]
  ];
}

- (void)handleCommandK {
  if (self.eventEmitter) {
    [self.eventEmitter sendEventWithName:@"onKeyboardCommand" body:@{@"command": @"commandK"}];
  }
}

- (BOOL)canBecomeFirstResponder {
  return YES;
}

@end

@interface KeyboardCommandModule ()
@property (nonatomic, strong) KeyCommandHandler *keyCommandHandler;
@end

@implementation KeyboardCommandModule

RCT_EXPORT_MODULE(KeyboardCommand);

+ (BOOL)requiresMainQueueSetup {
  return YES;
}

- (NSArray<NSString *> *)supportedEvents {
  return @[@"onKeyboardCommand"];
}

- (void)startObserving {
  dispatch_async(dispatch_get_main_queue(), ^{
    [self registerKeyCommands];
  });
}

- (void)stopObserving {
  dispatch_async(dispatch_get_main_queue(), ^{
    if (self.keyCommandHandler) {
      [self.keyCommandHandler willMoveToParentViewController:nil];
      [self.keyCommandHandler.view removeFromSuperview];
      [self.keyCommandHandler removeFromParentViewController];
      self.keyCommandHandler = nil;
    }
  });
}

- (void)registerKeyCommands {
  UIWindow *keyWindow = nil;
  for (UIWindow *window in [UIApplication sharedApplication].windows) {
    if (window.isKeyWindow) {
      keyWindow = window;
      break;
    }
  }
  
  if (!keyWindow || !keyWindow.rootViewController) {
    return;
  }
  
  if (self.keyCommandHandler) {
    [self.keyCommandHandler willMoveToParentViewController:nil];
    [self.keyCommandHandler.view removeFromSuperview];
    [self.keyCommandHandler removeFromParentViewController];
    self.keyCommandHandler = nil;
  }
  
  KeyCommandHandler *handler = [[KeyCommandHandler alloc] init];
  handler.eventEmitter = self;
  self.keyCommandHandler = handler;
  
  UIViewController *rootVC = keyWindow.rootViewController;
  while (rootVC.presentedViewController) {
    rootVC = rootVC.presentedViewController;
  }
  
  [rootVC addChildViewController:handler];
  [rootVC.view addSubview:handler.view];
  handler.view.frame = CGRectZero;
  handler.view.alpha = 0;
  handler.view.userInteractionEnabled = NO;
  handler.view.hidden = YES;
  [handler didMoveToParentViewController:rootVC];
}

@end
