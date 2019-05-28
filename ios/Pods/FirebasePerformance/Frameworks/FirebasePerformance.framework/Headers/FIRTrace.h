#import <Foundation/Foundation.h>

#import "FIRPerformanceAttributable.h"

/**
 * FIRTrace objects contain information about a "Trace", which is a sequence of steps. Traces can be
 * used to measure the time taken for a sequence of steps.
 * Traces also include "Counters". Counters are used to track information which is cumulative in
 * nature (e.g., Bytes downloaded). Counters are scoped to an FIRTrace object.
 */
NS_EXTENSION_UNAVAILABLE("FirebasePerformance does not support app extensions at this time.")
NS_SWIFT_NAME(Trace)
@interface FIRTrace : NSObject <FIRPerformanceAttributable>

/** @brief Name of the trace. */
@property(nonatomic, copy, readonly, nonnull) NSString *name;

/** @brief Not a valid initializer. */
- (nonnull instancetype)init NS_UNAVAILABLE;

/**
 * Starts the trace.
 */
- (void)start;

/**
 * Stops the trace if the trace is active.
 */
- (void)stop;

/**
 * Increments the counter for the provided counter name by 1. If it is a new counter name, the
 * counter value will be initialized to 1. Does nothing if the trace has not been started or has
 * already been stopped.
 *
 * Note: This API has been deprecated. Please use -incrementMetric:byInt: instead.
 *
 * @param counterName The name of the counter to increment.
 */
- (void)incrementCounterNamed:(nonnull NSString *)counterName
    NS_SWIFT_NAME(incrementCounter(named:))
    DEPRECATED_MSG_ATTRIBUTE("Please use -incrementMetric:byInt: instead.");

/**
 * Increments the counter for the provided counter name with the provided value. If it is a new
 * counter name, the counter value will be initialized to the value. Does nothing if the trace has
 * not been started or has already been stopped.
 *
 * Note: This API has been deprecated. Please use -incrementMetric:byInt: instead.
 *
 * @param counterName The name of the counter to increment.
 * @param incrementValue The value the counter would be incremented with.
 */
- (void)incrementCounterNamed:(nonnull NSString *)counterName by:(NSInteger)incrementValue
    NS_SWIFT_NAME(incrementCounter(named:by:))
    DEPRECATED_MSG_ATTRIBUTE("Please use -incrementMetric:byInt: instead.");

#pragma mark - Metrics API

/**
 * Atomically increments the metric for the provided metric name with the provided value. If it is a
 * new metric name, the metric value will be initialized to the value. Does nothing if the trace
 * has not been started or has already been stopped.
 *
 * @param metricName The name of the metric to increment.
 * @param incrementValue The value to increment the metric by.
 */
- (void)incrementMetric:(nonnull NSString *)metricName byInt:(int64_t)incrementValue
    NS_SWIFT_NAME(incrementMetric(_:by:));

/**
 * Gets the value of the metric for the provided metric name. If the metric doesn't exist, a 0 is
 * returned.
 *
 * @param metricName The name of metric whose value to get.
 * @return The value of the given metric or 0 if it hasn't yet been set.
 */
- (int64_t)valueForIntMetric:(nonnull NSString *)metricName
    NS_SWIFT_NAME(valueForMetric(_:));

/**
 * Sets the value of the metric for the provided metric name to the provided value. Does nothing if
 * the trace has not been started or has already been stopped.
 *
 * @param metricName The name of the metric to set.
 * @param value The value to set the metric to.
 */
- (void)setIntValue:(int64_t)value forMetric:(nonnull NSString *)metricName
    NS_SWIFT_NAME(setValue(_:forMetric:));

@end
