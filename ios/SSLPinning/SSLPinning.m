#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(SSLPinning, NSObject)

RCT_EXTERN_METHOD(setCertificate:(NSString *)server
                  :(NSString *)path
                  :(NSString *)password)

@end
