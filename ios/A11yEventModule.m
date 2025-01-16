//
//  A11yEventModule.m
//  RocketChatRN
//
//  Created by Otávio Stasiak on 15/01/25.
//  Copyright © 2025 Facebook. All rights reserved.
//


#import "A11yEventModule.h"
#import <React/RCTLog.h>
#import <React/RCTUIManager.h>
#import <UIKit/UIKit.h>

@implementation A11yEventModule
@synthesize bridge = _bridge;

RCT_EXPORT_MODULE(A11yEvent);

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(isVoiceOverEnabled)
{
  return @(UIAccessibilityIsVoiceOverRunning());
}

RCT_EXPORT_METHOD(
  setA11yOrder: (nonnull NSArray<NSNumber *> *)elements
  node:(nonnull NSNumber *)node
) {
  dispatch_async(dispatch_get_main_queue(), ^{
    UIView *parentView = [self.bridge.uiManager viewForReactTag:node];
    if (parentView != nil) {
      NSMutableArray *orderedElements = [NSMutableArray arrayWithCapacity:[elements count]];
      
      for (NSNumber *tag in elements) {
        UIView *childView = [self.bridge.uiManager viewForReactTag:tag];
        if (childView != nil) {
          [orderedElements addObject:childView];
        }
      }
      
      parentView.accessibilityElements = orderedElements;
      
      // Optionally notify VoiceOver of the change
      UIAccessibilityPostNotification(UIAccessibilityScreenChangedNotification, parentView);
    }
  });
}


@end
