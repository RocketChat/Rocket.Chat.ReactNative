//
//  JitsiMeetViewController.m
//  RocketChatRN
//
//  Created by Djorkaeff Alexandre Vilela Pereira on 15/07/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

#import "JitsiMeetViewController.h"

@implementation JitsiMeetViewController

- (void)viewDidLoad {
  [super viewDidLoad];
}

- (void) setDelegate:(id<JitsiMeetViewDelegate>) delegate {
  JitsiMeetView *jitsiMeetView = (JitsiMeetView *) self.view;
  if (delegate) {
    jitsiMeetView.delegate = delegate;
  }
}

- (void)loadUrl:(NSString *) url {
  JitsiMeetView *jitsiMeetView = (JitsiMeetView *) self.view;
  [jitsiMeetView loadURLString:url];
}

- (void)didReceiveMemoryWarning {
  [super didReceiveMemoryWarning];
}

@end
