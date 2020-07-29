/*
 * Copyright 2018 Google
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#import "GDTCORLibrary/Private/GDTCORTransformer.h"
#import "GDTCORLibrary/Private/GDTCORTransformer_Private.h"

#import <GoogleDataTransport/GDTCORAssert.h>
#import <GoogleDataTransport/GDTCORConsoleLogger.h>
#import <GoogleDataTransport/GDTCOREvent.h>
#import <GoogleDataTransport/GDTCOREventTransformer.h>
#import <GoogleDataTransport/GDTCORLifecycle.h>
#import <GoogleDataTransport/GDTCORStorageProtocol.h>

#import "GDTCORLibrary/Private/GDTCOREvent_Private.h"
#import "GDTCORLibrary/Private/GDTCORRegistrar_Private.h"

@implementation GDTCORTransformer

+ (instancetype)sharedInstance {
  static GDTCORTransformer *eventTransformer;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    eventTransformer = [[self alloc] init];
  });
  return eventTransformer;
}

- (instancetype)init {
  self = [super init];
  if (self) {
    _eventWritingQueue =
        dispatch_queue_create("com.google.GDTCORTransformer", DISPATCH_QUEUE_SERIAL);
  }
  return self;
}

- (void)transformEvent:(GDTCOREvent *)event
      withTransformers:(NSArray<id<GDTCOREventTransformer>> *)transformers
            onComplete:(void (^_Nullable)(BOOL wasWritten, NSError *_Nullable error))completion {
  GDTCORAssert(event, @"You can't write a nil event");
  BOOL hadOriginalCompletion = completion != nil;
  if (!completion) {
    completion = ^(BOOL wasWritten, NSError *_Nullable error) {
    };
  }

  __block GDTCORBackgroundIdentifier bgID = GDTCORBackgroundIdentifierInvalid;
  bgID = [[GDTCORApplication sharedApplication]
      beginBackgroundTaskWithName:@"GDTTransformer"
                expirationHandler:^{
                  [[GDTCORApplication sharedApplication] endBackgroundTask:bgID];
                  bgID = GDTCORBackgroundIdentifierInvalid;
                }];
  dispatch_async(_eventWritingQueue, ^{
    GDTCOREvent *transformedEvent = event;
    for (id<GDTCOREventTransformer> transformer in transformers) {
      if ([transformer respondsToSelector:@selector(transform:)]) {
        GDTCORLogDebug(@"Applying a transformer to event %@", event);
        transformedEvent = [transformer transform:transformedEvent];
        if (!transformedEvent) {
          completion(NO, nil);
          return;
        }
      } else {
        GDTCORLogError(GDTCORMCETransformerDoesntImplementTransform,
                       @"Transformer doesn't implement transform: %@", transformer);
        completion(NO, nil);
        return;
      }
    }

    id<GDTCORStorageProtocol> storage =
        [GDTCORRegistrar sharedInstance].targetToStorage[@(event.target)];

    [storage storeEvent:transformedEvent onComplete:hadOriginalCompletion ? completion : nil];

    // The work is done, cancel the background task if it's valid.
    [[GDTCORApplication sharedApplication] endBackgroundTask:bgID];
    bgID = GDTCORBackgroundIdentifierInvalid;
  });
}

#pragma mark - GDTCORLifecycleProtocol

- (void)appWillTerminate:(GDTCORApplication *)application {
  // Flush the queue immediately.
  dispatch_sync(_eventWritingQueue, ^{
                });
}

@end
