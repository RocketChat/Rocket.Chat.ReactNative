//
//  ShareRocketChatRN.m
//  ShareRocketChatRN
//
//  Created by Djorkaeff Alexandre Vilela Pereira on 16/05/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "ReactNativeShareExtension.h"
#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>
#import <React/RCTLog.h>
#import <Firebase.h>

@interface ShareRocketChatRN : ReactNativeShareExtension
@end

@implementation ShareRocketChatRN

RCT_EXPORT_MODULE();

- (UIView*) shareView {
  NSURL *jsCodeLocation;
  
  if(![FIRApp defaultApp]){
    [FIRApp configure];
  }
  
  jsCodeLocation = [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index" fallbackResource:nil];
  
  RCTRootView *rootView = [[RCTRootView alloc] initWithBundleURL:jsCodeLocation
                                                      moduleName:@"ShareRocketChatRN"
                                               initialProperties:nil
                                                   launchOptions:nil];
  rootView.backgroundColor = nil;
  
  // Uncomment for console output in Xcode console for release mode on device:
  // RCTSetLogThreshold(RCTLogLevelInfo - 1);
  
  return rootView;
}

@end
