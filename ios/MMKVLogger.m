//
//  MMKVLogger.m
//  RocketChatRN
//
//  Native module to log to os_log from JavaScript for TestFlight debugging
//  View logs in Console.app by filtering for subsystem: chat.rocket.reactnative
//

#import "MMKVLogger.h"
#import <os/log.h>

@implementation MMKVLogger

RCT_EXPORT_MODULE(MMKVLogger)

+ (BOOL)requiresMainQueueSetup {
    return NO;
}

// Log info message
RCT_EXPORT_METHOD(info:(NSString *)category message:(NSString *)message) {
    os_log_t logger = os_log_create("chat.rocket.reactnative", [category UTF8String]);
    os_log_with_type(logger, OS_LOG_TYPE_INFO, "%{public}s", [message UTF8String]);
    NSLog(@"[%@] %@", category, message);
}

// Log error message
RCT_EXPORT_METHOD(error:(NSString *)category message:(NSString *)message) {
    os_log_t logger = os_log_create("chat.rocket.reactnative", [category UTF8String]);
    os_log_with_type(logger, OS_LOG_TYPE_ERROR, "%{public}s", [message UTF8String]);
    NSLog(@"[%@] ERROR: %@", category, message);
}

// Log debug message
RCT_EXPORT_METHOD(debug:(NSString *)category message:(NSString *)message) {
    os_log_t logger = os_log_create("chat.rocket.reactnative", [category UTF8String]);
    os_log_with_type(logger, OS_LOG_TYPE_DEBUG, "%{public}s", [message UTF8String]);
    NSLog(@"[%@] DEBUG: %@", category, message);
}

// Log warning message
RCT_EXPORT_METHOD(warning:(NSString *)category message:(NSString *)message) {
    os_log_t logger = os_log_create("chat.rocket.reactnative", [category UTF8String]);
    os_log_with_type(logger, OS_LOG_TYPE_DEFAULT, "⚠️ %{public}s", [message UTF8String]);
    NSLog(@"[%@] WARNING: %@", category, message);
}

// Log fault message (critical errors)
RCT_EXPORT_METHOD(fault:(NSString *)category message:(NSString *)message) {
    os_log_t logger = os_log_create("chat.rocket.reactnative", [category UTF8String]);
    os_log_with_type(logger, OS_LOG_TYPE_FAULT, "❌ %{public}s", [message UTF8String]);
    NSLog(@"[%@] FAULT: %@", category, message);
}

@end

