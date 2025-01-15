//
//  A11yEventModule.m
//  RocketChatRN
//
//  Created by Otávio Stasiak on 15/01/25.
//  Copyright © 2025 Facebook. All rights reserved.
//

// RCTCalendarModule.m
#import "A11yEventModule.h"
#import <React/RCTLog.h>
#import <React/RCTUIManager.h>
#import <UIKit/UIKit.h>

@implementation A11yEventModule
@synthesize bridge = _bridge; // Add this line

// To export a module named RCTCalendarModule
RCT_EXPORT_MODULE(A11yEvent);

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(isVoiceOverEnabled)
{
  return @(UIAccessibilityIsVoiceOverRunning());
}


RCT_EXPORT_METHOD(
                  setA11yOrder: (nonnull NSArray *)elements
                  
                  ) {
    dispatch_async(dispatch_get_main_queue(), ^{
        UIView *field = [self.bridge.uiManager viewForReactTag:elements[0]];
        if(field != nil) {
            UIAccessibilityPostNotification(UIAccessibilityScreenChangedNotification, field); // ToDo, make this optional
        }
        NSMutableArray *fields = [NSMutableArray arrayWithCapacity:[elements count]];
        
        [elements enumerateObjectsUsingBlock:^(id obj, NSUInteger idx, BOOL * stop) {
            NSNumber *tag = (NSNumber *)obj;
            UIView *field = [self.bridge.uiManager viewForReactTag:tag];
            if (field != nil) {
                [fields addObject:field];
            }
        }];
        [field setAccessibilityElements: fields];
    });
}



@end
