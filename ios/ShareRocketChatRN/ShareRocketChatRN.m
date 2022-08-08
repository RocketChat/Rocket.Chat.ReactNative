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
#import <React/RCTBridgeDelegate.h>

#import <MMKV/MMKV.h>
#import <Firebase.h>
#import <Bugsnag/Bugsnag.h>

@interface ShareRocketChatRN : ReactNativeShareExtension <RCTBridgeDelegate>
@end;

@implementation ShareRocketChatRN

RCT_EXPORT_MODULE();

- (UIView*) shareView {
  NSURL *jsCodeLocation;
  
  if(![FIRApp defaultApp]){
    [FIRApp configure];
  }
  [Bugsnag start];
  
  jsCodeLocation = [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
  
  RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:nil];
  RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:bridge
                                               moduleName:@"ShareRocketChatRN"
                                               initialProperties:nil];
  rootView.backgroundColor = nil;
  
  // Uncomment for console output in Xcode console for release mode on device:
  // RCTSetLogThreshold(RCTLogLevelInfo - 1);

  // AppGroup MMKV
  NSString *groupDir = [[NSFileManager defaultManager] containerURLForSecurityApplicationGroupIdentifier:[[NSBundle mainBundle] objectForInfoDictionaryKey:@"AppGroup"]].path;
  [MMKV initializeMMKV:nil groupDir:groupDir logLevel:MMKVLogNone];
  
  return rootView;
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  #if DEBUG
    return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
  #else
    return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
  #endif
}

@end
