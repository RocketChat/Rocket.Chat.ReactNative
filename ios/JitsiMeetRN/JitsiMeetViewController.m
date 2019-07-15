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

- (void)callVoice:(NSString *)url {
  JitsiMeetView *jitsiMeetView = (JitsiMeetView *) self.view;
  JitsiMeetConferenceOptions *options = [JitsiMeetConferenceOptions fromBuilder:^(JitsiMeetConferenceOptionsBuilder *builder) {        builder.room = url;
      builder.videoMuted = YES;
  }];
  [jitsiMeetView join:options];
}

- (void)callVideo:(NSString *)url {
  JitsiMeetView *jitsiMeetView = (JitsiMeetView *) self.view;
  JitsiMeetConferenceOptions *optionsBuilder = [JitsiMeetConferenceOptions fromBuilder:^(JitsiMeetConferenceOptionsBuilder *builder) {
    builder.room = url;
  }];
  
  [jitsiMeetView join:optionsBuilder];
}

- (void)didReceiveMemoryWarning {
  [super didReceiveMemoryWarning];
}

@end
