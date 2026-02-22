#import "RCTWatchModule.h"
//#import "RocketChatRN-Swift.h"


//@interface RCTWatchModule()
////@property(nonatomic, strong) WatchModuleImpl *watchModule;
//@end
//
//@implementation RCTWatchModule
//
//- (id) init {
//  if (self = [super init]) {
////      _watchModule = [[WatchModuleImpl alloc] init];
//  }
//  return self;
//}
//
//- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const facebook::react::ObjCTurboModule::InitParams &)params {
//  return std::make_shared<facebook::react::NativeWatchModuleSpecJSI>(params);
//}
//
//- (void)syncQuickReplies {
////    [_watchModule syncQuickReplies];
//    NSLog(@"syncQuickReplies code");
//}
//
////- (BOOL)isWatchAvailable {
////    return [_watchModule isWatchAvailable];
////    NSLog(@"isWatchAvailable code");
////}
//
//+ (NSString *)moduleName
//{
//  return @"WatchModule";
//}
//
//@end

@implementation RCTWatchModule

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
  (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeWatchModuleSpecJSI>(params);
}

- (void)syncQuickReplies {
  NSLog(@"syncQuickReplies code");
}

- (NSString *)testModule{
    return @"test succeed";
}

+ (NSString *)moduleName
{
  return @"WatchModule";
}

@end
