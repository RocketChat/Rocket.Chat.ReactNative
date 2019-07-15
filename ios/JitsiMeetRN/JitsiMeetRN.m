//
//  JitsiMeetRN.m
//  RocketChatRN
//
//  Created by Djorkaeff Alexandre Vilela Pereira on 15/07/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

#import "JitsiMeetRN.h"

@implementation JitsiMeetRN {
    JitsiMeetViewController *jitsiMeetViewController;
}

RCT_EXPORT_MODULE()

- (void)conferenceJoined:(NSDictionary *)data {
    RCTLogInfo(@"Conference joined");
    [self sendEventWithName:@"CONFERENCE_JOINED" body:data];
}

- (void)conferenceLeft:(NSDictionary *)data {
    RCTLogInfo(@"Conference left");
    UIViewController* rootViewController = [[[[UIApplication sharedApplication]delegate] window] rootViewController];
    UINavigationController *navigationController = (UINavigationController *) rootViewController;
    [navigationController popViewControllerAnimated:YES];
    [self sendEventWithName:@"CONFERENCE_LEFT" body:data];
}

- (void)conferenceWillJoin:(NSDictionary *)data {
    RCTLogInfo(@"Conference will join");
    [self sendEventWithName:@"CONFERENCE_WILL_JOIN" body:data];
}

- (NSArray<NSString *> *)supportedEvents
{
    return @[@"CONFERENCE_JOINED", @"CONFERENCE_LEFT", @"CONFERENCE_WILL_JOIN"];
}

RCT_EXPORT_METHOD(initialize)
{
    RCTLogInfo(@"Initialize");
    UIStoryboard *storyboard = [UIStoryboard storyboardWithName:@"JitsiMeet" bundle:nil];
    jitsiMeetViewController = [storyboard instantiateViewControllerWithIdentifier:@"jitsiMeetStoryBoardID"];
}

RCT_EXPORT_METHOD(call:(NSString *)urlString)
{
    RCTLogInfo(@"Load URL %@", urlString);
    dispatch_sync(dispatch_get_main_queue(), ^{
        UIViewController* rootViewController = [[[[UIApplication sharedApplication]delegate] window] rootViewController];
        UINavigationController *navigationController = (UINavigationController *) rootViewController;
        [navigationController pushViewController:jitsiMeetViewController animated:true];
        [jitsiMeetViewController setDelegate:self];
        [jitsiMeetViewController loadUrl:urlString];
    });
}

@end
