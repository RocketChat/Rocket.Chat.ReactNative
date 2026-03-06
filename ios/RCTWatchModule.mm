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
- (NSString *)syncQuickReplies {
    
    if(![self isWatchSupported] || ![self isWatchAppInstalled]){
        return @"[ERROR]: WatchApp not supported";
    }
    
    NSString *currentServer = [self getValueFromMMKV:mmkvCurrentServerKey];
    if (!currentServer || currentServer.length == 0) {
        RCTLogInfo(@"No current server found");
        return @"[ERROR]: No current server found";
    }
    
    // key: server-RC_WATCHOS_QUICKREPLIES
    NSString *quickRepliesKey = [NSString
                                 stringWithFormat:@"%@-%@", currentServer, mmkvQuickRepliesKey];
    
    // get replies stored in MMKV
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
            NSString *message =
            error ? [NSString stringWithFormat:@"%@/%@",@"[ERROR]: ",[error localizedDescription]]
            : @"[ERROR]: JSON parse error";
            return message;
        } else {
            // quick replies are stored as array of strings
            if ([json isKindOfClass:[NSArray class]]) {
                NSArray *array = (NSArray *)json;
                try {
                    NSError *error = nil;
                    
                    // Update WCSession application context with quickreplies and current server of mobile app
                    BOOL success = [_session updateApplicationContext:@{
                        @"quickReplies" : array,
                        @"server" : currentServer,
                        /**
                         * when we send context make sure its unique each time
                         * otherwise WatchApp will not fire `updateApplicationContext`
                         */
                        @"_t" : @(arc4random())
                    }
                                                                error:&error];
                    
                    if (!success || error) {
                        NSString *message =
                        error ? [NSString stringWithFormat:@"%@/%@",@"[ERROR]: ",[error localizedDescription]]
                        : @"[ERROR]: Unknown Watch error";
                        return message;
                    }
                    
                    NSString *replies = [array componentsJoinedByString:@", "];
                    return replies;
                } catch (const std::exception &e) {
                    NSString *message = @"[ERROR]: Watch sync exception";
                    RCTLogError(@"Watch sync exception: %s", e.what());
                    return message;
                }
            } else {
                NSString *message = @"[ERROR]: Parsed JSON but unknown type";
                return message;
            }
        }
    } else {
        RCTLogInfo(@"No replies found in MMKV");
        return @"[ERROR]: quick replies not found in MMKV";
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
@end
