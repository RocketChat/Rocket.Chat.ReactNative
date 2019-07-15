//
//  JitsiMeetRN.h
//  RocketChatRN
//
//  Created by Djorkaeff Alexandre Vilela Pereira on 15/07/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <React/RCTLog.h>
#import <JitsiMeet/JitsiMeetViewDelegate.h>
#import "JitsiMeetViewController.h"

@interface JitsiMeetRN : RCTEventEmitter <RCTBridgeModule, JitsiMeetViewDelegate>
@end

