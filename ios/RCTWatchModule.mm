#import "RCTWatchModule.h"
#import "Shared/RocketChat/MMKVBridge.h"
#import <React/RCTLog.h>
#import <WatchConnectivity/WCSession.h>
#import <stdexcept>

@interface RCTWatchModule ()
@property(nonatomic, strong) WCSession *session;
@end

@implementation RCTWatchModule

// sync this with key declared in keys.ts
NSString *mmkvQuickRepliesKey = @"RC_WATCHOS_QUICKREPLIES";
NSString *mmkvCurrentServerKey = @"currentServer";

#pragma mark - initialisation

- (id)init {
    if (self = [super init]) {
        _session = WCSession.defaultSession;
    }
    return self;
}

#pragma mark - turbo modules register
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
    return std::make_shared<facebook::react::NativeWatchModuleSpecJSI>(params);
}

+ (NSString *)moduleName {
    return @"WatchModule";
}

#pragma mark - mmkv
- (MMKVBridge *)getMMKV {
    MMKVBridge *mmkv = [[MMKVBridge alloc] initWithID:@"default"
                                             cryptKey:nil
                                             rootPath:nil];
    return mmkv;
}

- (NSString *)getValueFromMMKV:(NSString *)key {
    MMKVBridge *mmkv = [self getMMKV];

    if (!mmkv) {
        RCTLogInfo(@"MMKV not initialized");
        return nil;
    }

    NSString *value = [mmkv stringForKey:key];

    return value;
}

#pragma mark - internal methods
- (BOOL)isSupported {
    if ([WCSession isSupported]) {
        return YES;
    } else {
        return NO;
    }
}

#pragma mark - spec methods (declared in spec)
- (void)syncQuickReplies {
    NSString *currentServer = [self getValueFromMMKV:mmkvCurrentServerKey];
    if (!currentServer || currentServer.length == 0) {
        RCTLogInfo(@"No current server found");
        return;
    }
    NSString *quickRepliesKey = [NSString
        stringWithFormat:@"%@-%@", currentServer, mmkvQuickRepliesKey];

    NSString *replies = [self getValueFromMMKV:quickRepliesKey];

    if (replies && replies.length > 0) {
        NSData *data = [replies dataUsingEncoding:NSUTF8StringEncoding];

        // string to json conversion
        NSError *error = nil;
        id json = [NSJSONSerialization
            JSONObjectWithData:data
                       options:NSJSONReadingMutableContainers
                         error:&error];

        if (error) {
            std::string message =
                error ? [[error localizedDescription] UTF8String]
                      : "JSON parse error";
            throw std::runtime_error(message);
        } else {
            // quick replies are stored as array of strings
            if ([json isKindOfClass:[NSArray class]]) {
                NSArray *array = (NSArray *)json;
                try {
                    NSError *error = nil;

                    BOOL success = [_session updateApplicationContext:@{
                        @"quickReplies" : array,
                        @"server" : currentServer
                    }
                                                                error:&error];

                    if (!success || error) {
                        std::string message =
                            error ? [[error localizedDescription] UTF8String]
                                  : "Unknown Watch error";
                        throw std::runtime_error(message);
                    }
                } catch (const std::exception &e) {
                    std::string message = "Watch sync exception";
                    throw std::runtime_error(message);
                    RCTLogError(@"Watch sync exception: %s", e.what());
                }
            } else {
                std::string message = "Parsed JSON but unknown type";
                throw std::runtime_error(message);
            }
        }
    } else {
        RCTLogInfo(@"No replies found in MMKV");
    }
}

- (nonnull NSNumber *)isWatchSupported {
    if (![self isSupported]) {
        return @(0);
    } else {
        return @(1);
    }
}

- (nonnull NSNumber *)isWatchPaired {
    if (![self isSupported]) {
        return @(0);
    } else {
        BOOL available = [_session isPaired];
        return @(available);
    }
}

- (nonnull NSNumber *)isWatchAppInstalled {
    if (![self isSupported]) {
        return @(0);
    } else {
        BOOL available = [_session isWatchAppInstalled];
        return @(available);
    }
}

- (NSString *)getCurrentServerFromNative {
    NSString *currentServer = [self getValueFromMMKV:mmkvCurrentServerKey];
    return currentServer;
}

- (NSString *)getkey {
    NSString *currentServer = [self getValueFromMMKV:mmkvCurrentServerKey];
    NSString *quickRepliesKey = [NSString
        stringWithFormat:@"%@-%@", currentServer, mmkvQuickRepliesKey];
    return quickRepliesKey;
}
- (NSString *)getReplies {
    NSString *currentServer = [self getValueFromMMKV:mmkvCurrentServerKey];
    if (!currentServer || currentServer.length == 0) {
        RCTLogInfo(@"No current server found");
        return @"error no current server found";
    }
    NSString *quickRepliesKey = [NSString
        stringWithFormat:@"%@-%@", currentServer, mmkvQuickRepliesKey];

    NSString *replies = [self getValueFromMMKV:quickRepliesKey];
    return replies;
}

@end
