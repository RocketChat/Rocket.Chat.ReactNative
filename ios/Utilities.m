//
//  Utilities.m
//  RocketChatRN
//
//  Created by Djorkaeff Alexandre Vilela Pereira on 7/9/20.
//  Copyright © 2020 Rocket.Chat. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "Utilities.h"

@implementation Utilities

+ (NSString *)random:(int)len {
    NSString *letters = @"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    NSMutableString *randomString = [NSMutableString stringWithCapacity:len];

    for (int i = 0; i < len; i++) {
        [randomString appendFormat: @"%C", [letters characterAtIndex:arc4random_uniform((uint32_t)[letters length])]];
    }

    return randomString;
}

+ (NSString *)removeTrailingSlash:(NSString *)host {
    if ([host length] > 0) {
        unichar last = [host characterAtIndex:[host length] - 1];
        if (last == '/') {
            host = [host substringToIndex:[host length] - 1];
        }
    }
    return host;
}

@end
