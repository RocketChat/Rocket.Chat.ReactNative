#import "KeyboardCommandModule.h"
#import <React/RCTLog.h>
#import <React/RCTKeyCommands.h>
#import <UIKit/UIKit.h>

@interface KeyboardCommandModule ()
@property (nonatomic, assign) BOOL registered;
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
  if (self.registered) {
    return;
  }
  self.registered = YES;
  dispatch_async(dispatch_get_main_queue(), ^{
    if (![[RCTKeyCommands sharedInstance] isKeyCommandRegisteredForInput:@"k" modifierFlags:UIKeyModifierCommand]) {
      [[RCTKeyCommands sharedInstance] registerKeyCommandWithInput:@"k"
                                                     modifierFlags:UIKeyModifierCommand
                                                            action:^(UIKeyCommand *command) {
                                                              [self sendEventWithName:@"onKeyboardCommand" body:@{@"command": @"commandK"}];
                                                            }];
    }
  });
}

- (void)stopObserving {
  if (!self.registered) {
    return;
  }
  self.registered = NO;
  dispatch_async(dispatch_get_main_queue(), ^{
    if ([[RCTKeyCommands sharedInstance] isKeyCommandRegisteredForInput:@"k" modifierFlags:UIKeyModifierCommand]) {
      [[RCTKeyCommands sharedInstance] unregisterKeyCommandWithInput:@"k" modifierFlags:UIKeyModifierCommand];
    }
  });
}

@end
