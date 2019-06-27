#import <Foundation/Foundation.h>

#import "developers/mobile/abt/proto/ExperimentPayload.pbobjc.h"

NS_ASSUME_NONNULL_BEGIN

@class FIRLifecycleEvents;

/// The default experiment overflow policy, that is to discard the experiment with the oldest start
/// time when users start the experiment on the web console.
extern const ABTExperimentPayload_ExperimentOverflowPolicy FIRDefaultExperimentOverflowPolicy;

/// This class is for Firebase services to handle experiments updates to Firebase Analytics.
/// Experiments can be set, cleared and updated through this controller.
@interface FIRExperimentController : NSObject

/// Returns the FIRExperimentController singleton.
+ (FIRExperimentController *)sharedInstance;

/// Updates the list of experiments. Experiments already existing in payloads are not affected,
/// whose state and payload is preserved. This method compares whether the experiments have changed
/// or not by their variant ID. This runs in a background queue.
/// @param origin         The originating service affected by the experiment, it is defined at
///                       Firebase Analytics FIREventOrigins.h.
/// @param events         A list of event names to be used for logging experiment lifecycle events,
///                       if they are not defined in the payload.
/// @param policy         The policy to handle new experiments when slots are full.
/// @param lastStartTime  The last known experiment start timestamp for this affected service.
///                       (Timestamps are specified by the number of seconds from 00:00:00 UTC on 1
///                       January 1970.).
/// @param payloads       List of experiment metadata.
- (void)updateExperimentsWithServiceOrigin:(NSString *)origin
                                    events:(FIRLifecycleEvents *)events
                                    policy:(ABTExperimentPayload_ExperimentOverflowPolicy)policy
                             lastStartTime:(NSTimeInterval)lastStartTime
                                  payloads:(NSArray<NSData *> *)payloads;

/// Returns the latest experiment start timestamp given a current latest timestamp and a list of
/// experiment payloads. Timestamps are specified by the number of seconds from 00:00:00 UTC on 1
/// January 1970.
/// @param timestamp  Current latest experiment start timestamp. If not known, affected service
///                   should specify -1;
/// @param payloads   List of experiment metadata.
- (NSTimeInterval)latestExperimentStartTimestampBetweenTimestamp:(NSTimeInterval)timestamp
                                                     andPayloads:(NSArray<NSData *> *)payloads;
@end

NS_ASSUME_NONNULL_END
