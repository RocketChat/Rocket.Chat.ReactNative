#import "QuickActionsStore.h"

static NSString * _Nullable RCPendingQuickActionType = nil;
static dispatch_queue_t rcQuickActionQueue;

__attribute__((constructor))
static void RCInitQuickActionQueue(void) {
  rcQuickActionQueue = dispatch_queue_create(
    "chat.rocket.quickactions.queue",
    DISPATCH_QUEUE_SERIAL
  );
}

void RCSetPendingQuickActionType(NSString * _Nullable type) {
  dispatch_sync(rcQuickActionQueue, ^{
    RCPendingQuickActionType = type;
  });
}

NSString * _Nullable RCConsumePendingQuickActionType(void) {
  __block NSString *type = nil;
  dispatch_sync(rcQuickActionQueue, ^{
    type = RCPendingQuickActionType;
    RCPendingQuickActionType = nil;
  });
  return type;
}
