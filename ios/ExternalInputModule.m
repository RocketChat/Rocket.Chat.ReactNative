#import "ExternalInputModule.h"
#import <GameController/GameController.h>
#import <stdarg.h>

@implementation ExternalInputModule
{
  BOOL _hasExternalKeyboard;
  BOOL _hasInitializedKeyboardState;
}

RCT_EXPORT_MODULE(ExternalInput);

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (instancetype)init
{
  self = [super init];
  if (self) {
    GCKeyboard *coalescedKeyboard = [GCKeyboard coalescedKeyboard];
    _hasExternalKeyboard = coalescedKeyboard != nil;
    _hasInitializedKeyboardState = YES;

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(handleKeyboardDidConnect:)
                                                 name:GCKeyboardDidConnectNotification
                                               object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(handleKeyboardDidDisconnect:)
                                                 name:GCKeyboardDidDisconnectNotification
                                               object:nil];
  }
  return self;
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)handleKeyboardDidConnect:(NSNotification *)notification
{
  _hasExternalKeyboard = YES;
  _hasInitializedKeyboardState = YES;
}

- (void)handleKeyboardDidDisconnect:(NSNotification *)notification
{
  _hasExternalKeyboard = NO;
  _hasInitializedKeyboardState = YES;
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(isExternalKeyboardConnected)
{
  BOOL fallbackFromCoalesced = [GCKeyboard coalescedKeyboard] != nil;
  BOOL hasExternalKeyboard = _hasInitializedKeyboardState ? _hasExternalKeyboard : fallbackFromCoalesced;
  return @(hasExternalKeyboard);
}

@end
