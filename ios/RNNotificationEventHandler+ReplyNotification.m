//
//  RNNotificationEventHandler+ReplyNotification.m
//  RocketChatRN
//
//  Created by Djorkaeff Alexandre Vilela Pereira on 7/9/20.
//  Copyright © 2020 Rocket.Chat. All rights reserved.
//

#import <objc/runtime.h>

#import "Utilities.h"
#import "RNUserDefaults.h"
#import "RCTConvert+RNNotifications.h"
#import "RNNotificationEventHandler+ReplyNotification.h"

@implementation RNNotificationEventHandler (ReplyNotification)

+ (void)load {
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    Class class = [self class];
    
    SEL originalSelector = @selector(didReceiveNotificationResponse:completionHandler:);
    SEL swizzledSelector = @selector(replyNotification_didReceiveNotificationResponse:completionHandler:);
    
    Method originalMethod = class_getInstanceMethod(class, originalSelector);
    Method swizzledMethod = class_getInstanceMethod(class, swizzledSelector);
    
    method_exchangeImplementations(originalMethod, swizzledMethod);
  });
}

#pragma mark - Method Swizzling

- (void)replyNotification_didReceiveNotificationResponse:(UNNotificationResponse *)response completionHandler:(void (^)(void))completionHandler {
  if ([response.actionIdentifier isEqualToString:@"REPLY_ACTION"]) {
    // convert notification data to dictionary payload
    NSDictionary *notification = [RCTConvert UNNotificationPayload:response.notification];
    
    // parse ejson from notification
    NSData *ejsonData = [[notification valueForKey:@"ejson"] dataUsingEncoding:NSUTF8StringEncoding];
    NSDictionary *ejson = [NSJSONSerialization JSONObjectWithData:ejsonData options:kNilOptions error:nil];
    
    // data from notification
    NSString *serverURL = [Utilities removeTrailingSlash:[ejson valueForKey:@"host"]];
    NSString *rid = [ejson valueForKey:@"rid"];

    // msg on textinput of notification
    NSString *msg = [(UNTextInputNotificationResponse *)response userText];
    
    // get credentials
    NSString *TOKEN_KEY = @"reactnativemeteor_usertoken";
    NSString *userId = [[RNUserDefaults getDefaultUser] stringForKey:[NSString stringWithFormat:@"%@-%@", TOKEN_KEY, serverURL]];
    NSString *token = [[RNUserDefaults getDefaultUser] stringForKey:[NSString stringWithFormat:@"%@-%@", TOKEN_KEY, userId]];
    
    // background task - we need this because fetch doesn't work if app is closed/killed
    UIApplication *app = [UIApplication sharedApplication];
    __block UIBackgroundTaskIdentifier task = [app beginBackgroundTaskWithExpirationHandler:^{
        [app endBackgroundTask:task];
        task = UIBackgroundTaskInvalid;
    }];
    
    // we use global queue to make requests with app closed/killed
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        // we make a synchronous request to post new message
        NSMutableURLRequest *request = [[NSMutableURLRequest alloc] initWithURL:[NSURL URLWithString:[NSString stringWithFormat:@"%@/api/v1/chat.sendMessage", serverURL]]];

        NSString *message = [NSString stringWithFormat:@"{ \"message\": { \"_id\": \"%@\", \"msg\": \"%@\", \"rid\": \"%@\" } }", [Utilities random:17], msg, rid];

        [request setHTTPMethod:@"POST"];
        [request setValue:@"application/json" forHTTPHeaderField:@"Content-Type"];
        [request addValue:userId forHTTPHeaderField:@"x-user-id"];
        [request addValue:token forHTTPHeaderField:@"x-auth-token"];
        [request setHTTPBody:[message dataUsingEncoding:NSUTF8StringEncoding]];

        [NSURLConnection sendSynchronousRequest:request returningResponse:nil error:nil];

        // end background task
        [app endBackgroundTask:task];
        task = UIBackgroundTaskInvalid;

        // complete notification response
        completionHandler();
    });
  } else {
    // Call the original method
    [self replyNotification_didReceiveNotificationResponse:response completionHandler:completionHandler];
  }
}

@end
