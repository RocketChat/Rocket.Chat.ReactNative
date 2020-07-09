//
//  Utilities.h
//  RocketChatRN
//
//  Created by Djorkaeff Alexandre Vilela Pereira on 7/9/20.
//  Copyright © 2020 Rocket.Chat. All rights reserved.
//

#import <Foundation/Foundation.h>

@interface Utilities: NSObject

+ (NSString *)random:(int)len;
+ (NSString *)removeTrailingSlash:(NSString *)host;

@end
