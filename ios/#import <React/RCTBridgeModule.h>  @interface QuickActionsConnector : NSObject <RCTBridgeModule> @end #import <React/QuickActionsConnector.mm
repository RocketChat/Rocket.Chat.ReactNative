#import "QuickActionsConnector.h"
#import "QuickActionsStore.h"

@implementation QuickActionsConnector

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(
  getInitialQuickAction:
  (RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
) {
  NSString *action = RCPendingQuickActionType;
  RCPendingQuickActionType = nil;
  resolve(action);
}

@end
