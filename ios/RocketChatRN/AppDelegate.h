/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>
#import <RCTAppDelegate.h>
#import <Expo/Expo.h>
#import <WatchConnectivity/WatchConnectivity.h>
// https://github.com/expo/expo/issues/17705#issuecomment-1196251146
#import "ExpoModulesCore-Swift.h"
#import "RocketChatRN-Swift.h"

@interface AppDelegate : EXAppDelegateWrapper

@property (nonatomic, strong) WatchConnection *watchConnection;

@end
