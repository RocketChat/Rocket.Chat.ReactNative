//
//  JitsiMeetViewController.h
//  RocketChatRN
//
//  Created by Djorkaeff Alexandre Vilela Pereira on 15/07/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

#import <UIKit/UIKit.h>
#import <JitsiMeet/JitsiMeet.h>

@interface JitsiMeetViewController : UIViewController

- (void)setDelegate:(id<JitsiMeetViewDelegate>)delegate;
- (void)call:(NSString *)url options:(NSDictionary *)options;

@end
