#import "A11yEventEmitter.h"
#import <React/RCTBridgeModule.h>

@implementation A11yEventEmitter

RCT_EXPORT_MODULE();

- (NSArray<NSString *> *)supportedEvents {
  return @[@"onAccessibilityEvent"];
}

@end
