/*
 * Copyright 2019 Google
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#import <Foundation/Foundation.h>
#import <SystemConfiguration/SystemConfiguration.h>

#if TARGET_OS_IOS || TARGET_OS_TV
#import <UIKit/UIKit.h>
#elif TARGET_OS_OSX
#import <AppKit/AppKit.h>
#endif  // TARGET_OS_IOS || TARGET_OS_TV

NS_ASSUME_NONNULL_BEGIN

/** A notification sent out if the app is backgrounding. */
FOUNDATION_EXPORT NSString *const kGDTApplicationDidEnterBackgroundNotification;

/** A notification sent out if the app is foregrounding. */
FOUNDATION_EXPORT NSString *const kGDTApplicationWillEnterForegroundNotification;

/** A notification sent out if the app is terminating. */
FOUNDATION_EXPORT NSString *const kGDTApplicationWillTerminateNotification;

/** Compares flags with the WWAN reachability flag, if available, and returns YES if present.
 *
 * @param flags The set of reachability flags.
 * @return YES if the WWAN flag is set, NO otherwise.
 */
BOOL GDTReachabilityFlagsContainWWAN(SCNetworkReachabilityFlags flags);

/** A typedef identify background identifiers. */
typedef volatile NSUInteger GDTBackgroundIdentifier;

/** A background task's invalid sentinel value. */
FOUNDATION_EXPORT const GDTBackgroundIdentifier GDTBackgroundIdentifierInvalid;

#if TARGET_OS_IOS || TARGET_OS_TV
/** A protocol that wraps UIApplicationDelegate or NSObject protocol, depending on the platform. */
@protocol GDTApplicationDelegate <UIApplicationDelegate>
#elif TARGET_OS_OSX
@protocol GDTApplicationDelegate <NSApplicationDelegate>
#else
@protocol GDTApplicationDelegate <NSObject>
#endif  // TARGET_OS_IOS || TARGET_OS_TV

@end

/** A cross-platform application class. */
@interface GDTApplication : NSObject <GDTApplicationDelegate>

/** Creates and/or returns the shared application instance.
 *
 * @return The shared application instance.
 */
+ (nullable GDTApplication *)sharedApplication;

/** Creates a background task with the returned identifier if on a suitable platform.
 *
 * @param handler The handler block that is called if the background task expires.
 * @return An identifier for the background task, or GDTBackgroundIdentifierInvalid if one couldn't
 * be created.
 */
- (GDTBackgroundIdentifier)beginBackgroundTaskWithExpirationHandler:
    (void (^__nullable)(void))handler;

/** Ends the background task if the identifier is valid.
 *
 * @param bgID The background task to end.
 */
- (void)endBackgroundTask:(GDTBackgroundIdentifier)bgID;

@end

NS_ASSUME_NONNULL_END
