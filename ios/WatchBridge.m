#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(WatchBridge, NSObject)

RCT_EXTERN_METHOD(
  getWatchStatus:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
  syncQuickReplies:(NSArray *)replies
  resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

@end
