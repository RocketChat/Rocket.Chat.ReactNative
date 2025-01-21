#import "AppDelegate.h"
#import <React/RCTBundleURLProvider.h>
#import <React/RCTLinkingManager.h>
#import "RNNotifications.h"
#import "RNBootSplash.h"
#import <Firebase.h>
#import <Bugsnag/Bugsnag.h>
#import <MMKV/MMKV.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  if(![FIRApp defaultApp]){
    [FIRApp configure];
  }
  [Bugsnag start];
  
  // AppGroup MMKV
  NSString *groupDir = [[NSFileManager defaultManager] containerURLForSecurityApplicationGroupIdentifier:[[NSBundle mainBundle] objectForInfoDictionaryKey:@"AppGroup"]].path;
  [MMKV initializeMMKV:nil groupDir:groupDir logLevel:MMKVLogDebug];
  
  [RNNotifications startMonitorNotifications];
  [ReplyNotification configure];

  self.moduleName = @"RocketChatRN";
  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};
  [super application:application didFinishLaunchingWithOptions:launchOptions];
  [RNBootSplash initWithStoryboard:@"LaunchScreen" rootView:self.window.rootViewController.view];
  [[[SSLPinning alloc] init] migrate];
  
  self.watchConnection = [[WatchConnection alloc] initWithSession:[WCSession defaultSession]];

  return YES;
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self getBundleURL];
}

- (NSURL *)getBundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken
{
  [RNNotifications didRegisterForRemoteNotificationsWithDeviceToken:deviceToken];
}

- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error {
  [RNNotifications didFailToRegisterForRemoteNotificationsWithError:error];
}

- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo fetchCompletionHandler:(void (^)(UIBackgroundFetchResult result))completionHandler {
[RNNotifications didReceiveBackgroundNotification:userInfo withCompletionHandler:completionHandler];
}

- (BOOL)application:(UIApplication *)application
  openURL:(NSURL *)url
  options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  return [RCTLinkingManager application:application openURL:url options:options];
}

- (BOOL)application:(UIApplication *)application continueUserActivity:(nonnull NSUserActivity *)userActivity
restorationHandler:(nonnull void (^)(NSArray<id<UIUserActivityRestoring>> * _Nullable))restorationHandler
{
return [RCTLinkingManager application:application
                  continueUserActivity:userActivity
                    restorationHandler:restorationHandler];
}

@end
