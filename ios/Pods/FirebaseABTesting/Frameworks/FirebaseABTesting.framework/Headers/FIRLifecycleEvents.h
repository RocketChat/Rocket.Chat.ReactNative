#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/// Default event name for when an experiment is set.
extern NSString *const FIRSetExperimentEventName;
/// Default event name for when an experiment is activated.
extern NSString *const FIRActivateExperimentEventName;
/// Default event name for when an experiment is cleared.
extern NSString *const FIRClearExperimentEventName;
/// Default event name for when an experiment times out for being activated.
extern NSString *const FIRTimeoutExperimentEventName;
/// Default event name for when an experiment is expired as it reaches the end of TTL.
extern NSString *const FIRExpireExperimentEventName;

/// An Experiment Lifecycle Event Object that specifies the name of the experiment event to be
/// logged by Firebase Analytics.
@interface FIRLifecycleEvents : NSObject

/// Event name for when an experiment is set. It is default to FIRSetExperimentEventName and can be
/// overriden. If experiment payload has a valid string of this field, always use experiment
/// payload.
@property(nonatomic, copy) NSString *setExperimentEventName;

/// Event name for when an experiment is activated. It is default to FIRActivateExperimentEventName
/// and can be overriden. If experiment payload has a valid string of this field, always use
/// experiment payload.
@property(nonatomic, copy) NSString *activateExperimentEventName;

/// Event name for when an experiment is clearred. It is default to FIRClearExperimentEventName and
/// can be overriden. If experiment payload has a valid string of this field, always use experiment
/// payload.
@property(nonatomic, copy) NSString *clearExperimentEventName;
/// Event name for when an experiment is timeout from being STANDBY. It is default to
/// FIRTimeoutExperimentEventName and can be overriden. If experiment payload has a valid string
/// of this field, always use experiment payload.
@property(nonatomic, copy) NSString *timeoutExperimentEventName;

/// Event name when an experiment is expired when it reaches the end of its TTL.
/// It is default to FIRExpireExperimentEventName and can be overriden. If experiment payload has a
/// valid string of this field, always use experiment payload.
@property(nonatomic, copy) NSString *expireExperimentEventName;

@end

NS_ASSUME_NONNULL_END
