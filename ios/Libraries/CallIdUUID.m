#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(CallIdUUID, NSObject)

RCT_EXTERN__BLOCKING_SYNCHRONOUS_METHOD(toUUID:(NSString *)callId)

@end
