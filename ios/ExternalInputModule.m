#import "ExternalInputModule.h"
#import <GameController/GameController.h>

@implementation ExternalInputModule

RCT_EXPORT_MODULE(ExternalInput);

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(isExternalKeyboardConnected)
{
  return @([GCKeyboard coalescedKeyboard] != nil);
}

@end
