#import "QuickActionsStore.h"

NSString * _Nullable RCPendingQuickActionType = nil;

void RCSetPendingQuickActionType(NSString * _Nullable type) {
  RCPendingQuickActionType = type;
}
