#import "React/RCTBridgeModule.h"

@interface RCT_EXTERN_MODULE(KeyCommandsManager, NSObject)

RCT_EXTERN_METHOD(registerKeyCommand:(NSString)input modifierFlags:(nonnull NSNumber)modifierFlags discoverableTitle:(NSString)discoverableTitle)

@end
