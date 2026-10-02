#import <React/RCTBridgeModule.h>

@interface PexipLoopbackProxy : NSObject
+ (void)startWithUpstreamOrigin:(NSString * _Nonnull)origin
                     completion:(void (^ _Nonnull)(NSString * _Nullable localOrigin, NSError * _Nullable error))completion;
+ (void)stop;
@end

@interface PexipProxyModule : NSObject <RCTBridgeModule>
@end

@implementation PexipProxyModule

RCT_EXPORT_MODULE(PexipProxy);

+ (BOOL)requiresMainQueueSetup {
  return NO;
}

RCT_EXPORT_METHOD(start:(NSString *)upstreamOrigin
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
  [PexipLoopbackProxy startWithUpstreamOrigin:upstreamOrigin completion:^(NSString *localOrigin, NSError *error) {
    if (error != nil || localOrigin == nil) {
      reject(@"pexip_proxy_start", error.localizedDescription ?: @"Pexip proxy failed to start", error);
      return;
    }
    resolve(localOrigin);
  }];
}

RCT_EXPORT_METHOD(stop) {
  [PexipLoopbackProxy stop];
}

@end
