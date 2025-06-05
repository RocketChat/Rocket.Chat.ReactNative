#import "AppDelegate.h"
#import <React/RCTBundleURLProvider.h>
#import <ReactAppDependencyProvider/RCTAppDependencyProvider.h>
#import <React/RCTLinkingManager.h>
#import "RNNotifications.h"
#import "RNBootSplash.h"
#import <Firebase.h>
#import <Bugsnag/Bugsnag.h>
#import <MMKV/MMKV.h>
#import <RNCallKeep/RNCallKeep.h>
#import <RNVoipPushNotification/RNVoipPushNotificationManager.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  if(![FIRApp defaultApp]){
    [FIRApp configure];
  }
  [Bugsnag start];
    
    [RNVoipPushNotificationManager voipRegistration];
  
  // AppGroup MMKV
  NSString *groupDir = [[NSFileManager defaultManager] containerURLForSecurityApplicationGroupIdentifier:[[NSBundle mainBundle] objectForInfoDictionaryKey:@"AppGroup"]].path;
  [MMKV initializeMMKV:nil groupDir:groupDir logLevel:MMKVLogDebug];
  
  [RNNotifications startMonitorNotifications];
  [ReplyNotification configure];

  self.moduleName = @"RocketChatRN";
  self.dependencyProvider = [RCTAppDependencyProvider new];
  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};
  [super application:application didFinishLaunchingWithOptions:launchOptions];
  [RNBootSplash initWithStoryboard:@"LaunchScreen" rootView:self.window.rootViewController.view];
//  [[[SSLPinning alloc] init] migrate];
    
    [RNCallKeep setup:@{@"appName": @"Rocket.Chat"}];
//      [RNVoipPushNotificationManager voipRegistration];
    
  
  self.watchConnection = [[WatchConnection alloc] initWithSession:[WCSession defaultSession]];

  return YES;
}

// --- Handle updated push credentials
- (void)pushRegistry:(PKPushRegistry *)registry didUpdatePushCredentials:(PKPushCredentials *)credentials forType:(PKPushType)type {
  // Register VoIP push token (a property of PKPushCredentials) with server
  [RNVoipPushNotificationManager didUpdatePushCredentials:credentials forType:(NSString *)type];
}

- (void)pushRegistry:(PKPushRegistry *)registry didInvalidatePushTokenForType:(PKPushType)type
{
  // --- The system calls this method when a previously provided push token is no longer valid for use. No action is necessary on your part to reregister the push type. Instead, use this method to notify your server not to send push notifications using the matching push token.
}

// --- Handle incoming pushes
- (void)pushRegistry:(PKPushRegistry *)registry didReceiveIncomingPushWithPayload:(PKPushPayload *)payload forType:(PKPushType)type withCompletionHandler:(void (^)(void))completion {
  

  // --- NOTE: apple forced us to invoke callkit ASAP when we receive voip push
  // --- see: react-native-callkeep

  // --- Extract information from your voip push payload
  NSDictionary *payloadDict = payload.dictionaryPayload;
  NSLog(@"[VoIP] Received payload: %@", payloadDict);
  
  // Generate unique UUID for each call
  NSString *uuid = [[NSUUID UUID] UUIDString];
  
  // Extract call information from payload, with fallbacks
  NSString *callerName = @"Unknown Caller";
  NSString *handle = @"Unknown";
  BOOL hasVideo = NO;
  
  // Try to extract from common payload structures
  if (payloadDict[@"caller_name"]) {
    callerName = payloadDict[@"caller_name"];
  } else if (payloadDict[@"callerName"]) {
    callerName = payloadDict[@"callerName"];
  } else if (payloadDict[@"name"]) {
    callerName = payloadDict[@"name"];
  } else if (payloadDict[@"aps"][@"alert"][@"title"]) {
    callerName = payloadDict[@"aps"][@"alert"][@"title"];
  }
  
  if (payloadDict[@"caller_id"]) {
    handle = payloadDict[@"caller_id"];
  } else if (payloadDict[@"callerId"]) {
    handle = payloadDict[@"callerId"];
  } else if (payloadDict[@"handle"]) {
    handle = payloadDict[@"handle"];
  } else if (payloadDict[@"phone"]) {
    handle = payloadDict[@"phone"];
  }
  
  if (payloadDict[@"has_video"]) {
    hasVideo = [payloadDict[@"has_video"] boolValue];
  } else if (payloadDict[@"hasVideo"]) {
    hasVideo = [payloadDict[@"hasVideo"] boolValue];
  } else if (payloadDict[@"video"]) {
    hasVideo = [payloadDict[@"video"] boolValue];
  }
  
  // Use UUID from payload if provided
  if (payloadDict[@"uuid"]) {
    uuid = payloadDict[@"uuid"];
  } else if (payloadDict[@"call_id"]) {
    uuid = payloadDict[@"call_id"];
  } else if (payloadDict[@"callId"]) {
    uuid = payloadDict[@"callId"];
  }
  
  NSLog(@"[VoIP] Processing call - UUID: %@, Caller: %@, Handle: %@, Video: %d", uuid, callerName, handle, hasVideo);

  // --- this is optional, only required if you want to call `completion()` on the js side
  [RNVoipPushNotificationManager addCompletionHandler:uuid completionHandler:completion];

  // --- Process the received push
  [RNVoipPushNotificationManager didReceiveIncomingPushWithPayload:payload forType:(NSString *)type];

  // --- You should make sure to report to callkit BEFORE execute `completion()`
  [RNCallKeep reportNewIncomingCall:uuid 
                             handle:handle 
                         handleType:@"generic" 
                           hasVideo:hasVideo 
                localizedCallerName:callerName 
                    supportsHolding:false 
                       supportsDTMF:false 
                   supportsGrouping:false 
                 supportsUngrouping:false 
                        fromPushKit:true 
                            payload:payloadDict 
              withCompletionHandler:completion];
  
  // --- You don't need to call it if you stored `completion()` and will call it on the js side.
//  completion();
}

//- (void)pushRegistry:(PKPushRegistry *)registry didReceiveIncomingPushWithPayload:(PKPushPayload *)payload forType:(PKPushType)type withCompletionHandler:(void (^)(void))completion {
//  [RNVoipPushNotificationManager didReceiveIncomingPushWithPayload:payload forType:(NSString *)type];
//  NSString *uuid = [[[NSUUID UUID] UUIDString] lowercaseString];
//  NSString *callerName = @"Caller Name";
//  NSString *handle = @"Caller Number";
//  [RNCallKeep reportNewIncomingCall:uuid
//                             handle:handle
//                         handleType:@"generic"
//                           hasVideo:NO
//                localizedCallerName:callerName
//                    supportsHolding:YES
//                       supportsDTMF:YES
//                   supportsGrouping:YES
//                 supportsUngrouping:YES
//                        fromPushKit:YES
//                            payload:nil
//              withCompletionHandler:completion];
//}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self bundleURL];
}

- (NSURL *)bundleURL
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
