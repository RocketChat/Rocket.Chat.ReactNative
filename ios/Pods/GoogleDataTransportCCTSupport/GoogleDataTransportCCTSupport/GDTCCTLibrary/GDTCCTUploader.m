/*
 * Copyright 2019 Google
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

#import "GDTCCTLibrary/Private/GDTCCTUploader.h"

#import <GoogleDataTransport/GDTCORConsoleLogger.h>
#import <GoogleDataTransport/GDTCORPlatform.h>
#import <GoogleDataTransport/GDTCORRegistrar.h>

#import <nanopb/pb.h>
#import <nanopb/pb_decode.h>
#import <nanopb/pb_encode.h>

#import "GDTCCTLibrary/Private/GDTCCTCompressionHelper.h"
#import "GDTCCTLibrary/Private/GDTCCTNanopbHelpers.h"
#import "GDTCCTLibrary/Private/GDTCCTPrioritizer.h"

#import "GDTCCTLibrary/Protogen/nanopb/cct.nanopb.h"

#ifdef GDTCCTSUPPORT_VERSION
#define STR(x) STR_EXPAND(x)
#define STR_EXPAND(x) #x
static NSString *const kGDTCCTSupportSDKVersion = @STR(GDTCCTSUPPORT_VERSION);
#else
static NSString *const kGDTCCTSupportSDKVersion = @"UNKNOWN";
#endif  // GDTCCTSUPPORT_VERSION

#if !NDEBUG
NSNotificationName const GDTCCTUploadCompleteNotification = @"com.GDTCCTUploader.UploadComplete";
#endif  // #if !NDEBUG

@interface GDTCCTUploader ()

// Redeclared as readwrite.
@property(nullable, nonatomic, readwrite) NSURLSessionUploadTask *currentTask;

@end

@implementation GDTCCTUploader

+ (void)load {
  GDTCCTUploader *uploader = [GDTCCTUploader sharedInstance];
  [[GDTCORRegistrar sharedInstance] registerUploader:uploader target:kGDTCORTargetCCT];
}

+ (instancetype)sharedInstance {
  static GDTCCTUploader *sharedInstance;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    sharedInstance = [[GDTCCTUploader alloc] init];
  });
  return sharedInstance;
}

- (instancetype)init {
  self = [super init];
  if (self) {
    _uploaderQueue = dispatch_queue_create("com.google.GDTCCTUploader", DISPATCH_QUEUE_SERIAL);
    NSURLSessionConfiguration *config = [NSURLSessionConfiguration defaultSessionConfiguration];
    _uploaderSession = [NSURLSession sessionWithConfiguration:config];
  }
  return self;
}

- (NSURL *)defaultServerURL {
  static NSURL *defaultServerURL;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    // These strings should be interleaved to construct the real URL. This is just to (hopefully)
    // fool github URL scanning bots.
    const char *p1 = "hts/frbslgiggolai.o/0clgbth";
    const char *p2 = "tp:/ieaeogn.ogepscmvc/o/ac";
    const char defaultURL[54] = {
        p1[0],  p2[0],  p1[1],  p2[1],  p1[2],  p2[2],  p1[3],  p2[3],  p1[4],  p2[4],  p1[5],
        p2[5],  p1[6],  p2[6],  p1[7],  p2[7],  p1[8],  p2[8],  p1[9],  p2[9],  p1[10], p2[10],
        p1[11], p2[11], p1[12], p2[12], p1[13], p2[13], p1[14], p2[14], p1[15], p2[15], p1[16],
        p2[16], p1[17], p2[17], p1[18], p2[18], p1[19], p2[19], p1[20], p2[20], p1[21], p2[21],
        p1[22], p2[22], p1[23], p2[23], p1[24], p2[24], p1[25], p2[25], p1[26], '\0'};
    defaultServerURL = [NSURL URLWithString:[NSString stringWithUTF8String:defaultURL]];
  });
  return defaultServerURL;
}

- (void)uploadPackage:(GDTCORUploadPackage *)package {
  __block GDTCORBackgroundIdentifier bgID = GDTCORBackgroundIdentifierInvalid;
  bgID = [[GDTCORApplication sharedApplication]
      beginBackgroundTaskWithName:@"GDTCCTUploader-upload"
                expirationHandler:^{
                  if (bgID != GDTCORBackgroundIdentifierInvalid) {
                    // Cancel the current upload and complete delivery.
                    [self.currentTask cancel];
                    [self.currentUploadPackage completeDelivery];

                    // End the task.
                    [[GDTCORApplication sharedApplication] endBackgroundTask:bgID];
                  }
                }];

  dispatch_async(_uploaderQueue, ^{
    if (self->_currentTask || self->_currentUploadPackage) {
      GDTCORLogWarning(GDTCORMCWUploadFailed, @"%@",
                       @"An upload shouldn't be initiated with another in progress.");
      return;
    }
    NSURL *serverURL = self.serverURL ? self.serverURL : [self defaultServerURL];

    id completionHandler = ^(NSData *_Nullable data, NSURLResponse *_Nullable response,
                             NSError *_Nullable error) {
      GDTCORLogDebug("%@", @"CCT: request completed");
      if (error) {
        GDTCORLogWarning(GDTCORMCWUploadFailed, @"There was an error uploading events: %@", error);
      }
      NSError *decodingError;
      if (data) {
        gdt_cct_LogResponse logResponse = GDTCCTDecodeLogResponse(data, &decodingError);
        if (!decodingError && logResponse.has_next_request_wait_millis) {
          GDTCORLogDebug(
              "CCT: The backend responded asking to not upload for %lld millis from now.",
              logResponse.next_request_wait_millis);
          self->_nextUploadTime =
              [GDTCORClock clockSnapshotInTheFuture:logResponse.next_request_wait_millis];
        } else {
          GDTCORLogDebug("%@", @"CCT: The CCT backend response failed to parse, so the next "
                               @"request won't occur until 15 minutes from now");
          // 15 minutes from now.
          self->_nextUploadTime = [GDTCORClock clockSnapshotInTheFuture:15 * 60 * 1000];
        }
        pb_release(gdt_cct_LogResponse_fields, &logResponse);
      }
#if !NDEBUG
      // Post a notification when in DEBUG mode to state how many packages were uploaded. Useful
      // for validation during tests.
      [[NSNotificationCenter defaultCenter] postNotificationName:GDTCCTUploadCompleteNotification
                                                          object:@(package.events.count)];
#endif  // #if !NDEBUG
      GDTCORLogDebug("%@", @"CCT: package delivered");
      [package completeDelivery];

      // End the background task if there was one.
      if (bgID != GDTCORBackgroundIdentifierInvalid) {
        [[GDTCORApplication sharedApplication] endBackgroundTask:bgID];
        bgID = GDTCORBackgroundIdentifierInvalid;
      }
      self.currentTask = nil;
      self.currentUploadPackage = nil;
    };
    self->_currentUploadPackage = package;
    NSData *requestProtoData =
        [self constructRequestProtoFromPackage:(GDTCORUploadPackage *)package];
    NSData *gzippedData = [GDTCCTCompressionHelper gzippedData:requestProtoData];
    BOOL usingGzipData = gzippedData != nil && gzippedData.length < requestProtoData.length;
    NSData *dataToSend = usingGzipData ? gzippedData : requestProtoData;
    NSURLRequest *request = [self constructRequestWithURL:serverURL data:dataToSend];
    GDTCORLogDebug("CCT: request created: %@", request);
    self.currentTask = [self.uploaderSession uploadTaskWithRequest:request
                                                          fromData:dataToSend
                                                 completionHandler:completionHandler];
    GDTCORLogDebug("%@", @"CCT: The upload task is about to begin.");
    [self.currentTask resume];
  });
}

- (BOOL)readyToUploadWithConditions:(GDTCORUploadConditions)conditions {
  __block BOOL result = NO;
  dispatch_sync(_uploaderQueue, ^{
    if (self->_currentUploadPackage) {
      result = NO;
      GDTCORLogDebug("%@", @"CCT: can't upload because a package is in flight");
      return;
    }
    if (self->_currentTask) {
      result = NO;
      GDTCORLogDebug("%@", @"CCT: can't upload because a task is in progress");
      return;
    }
    if ((conditions & GDTCORUploadConditionHighPriority) == GDTCORUploadConditionHighPriority) {
      result = YES;
      GDTCORLogDebug("%@", @"CCT: a high priority event is allowing an upload");
      return;
    } else if (self->_nextUploadTime) {
      result = [[GDTCORClock snapshot] isAfter:self->_nextUploadTime];
#if !NDEBUG
      if (result) {
        GDTCORLogDebug("%@", @"CCT: can upload because the request wait time has transpired");
      } else {
        GDTCORLogDebug("%@", @"CCT: can't upload because the backend asked to wait");
      }
#endif  // !NDEBUG
      return;
    }
    GDTCORLogDebug("%@", @"CCT: can upload because nothing is preventing it");
    result = YES;
  });
  return result;
}

#pragma mark - Private helper methods

/** Constructs data given an upload package.
 *
 * @param package The upload package used to construct the request proto bytes.
 * @return Proto bytes representing a gdt_cct_LogRequest object.
 */
- (nonnull NSData *)constructRequestProtoFromPackage:(GDTCORUploadPackage *)package {
  // Segment the log events by log type.
  NSMutableDictionary<NSString *, NSMutableSet<GDTCORStoredEvent *> *> *logMappingIDToLogSet =
      [[NSMutableDictionary alloc] init];
  [package.events
      enumerateObjectsUsingBlock:^(GDTCORStoredEvent *_Nonnull event, BOOL *_Nonnull stop) {
        NSMutableSet *logSet = logMappingIDToLogSet[event.mappingID];
        logSet = logSet ? logSet : [[NSMutableSet alloc] init];
        [logSet addObject:event];
        logMappingIDToLogSet[event.mappingID] = logSet;
      }];

  gdt_cct_BatchedLogRequest batchedLogRequest =
      GDTCCTConstructBatchedLogRequest(logMappingIDToLogSet);

  NSData *data = GDTCCTEncodeBatchedLogRequest(&batchedLogRequest);
  pb_release(gdt_cct_BatchedLogRequest_fields, &batchedLogRequest);
  return data ? data : [[NSData alloc] init];
}

/** Constructs a request to CCT given a URL and request body data.
 *
 * @param URL The URL to send the request to.
 * @param data The request body data.
 * @return A new NSURLRequest ready to be sent to CCT.
 */
- (NSURLRequest *)constructRequestWithURL:(NSURL *)URL data:(NSData *)data {
  BOOL isGzipped = [GDTCCTCompressionHelper isGzipped:data];
  NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:URL];
  [request setValue:@"application/x-protobuf" forHTTPHeaderField:@"Content-Type"];
  if (isGzipped) {
    [request setValue:@"gzip" forHTTPHeaderField:@"Content-Encoding"];
  }
  [request setValue:@"gzip" forHTTPHeaderField:@"Accept-Encoding"];
  NSString *userAgent = [NSString stringWithFormat:@"datatransport/%@ cctsupport/%@ apple/",
                                                   kGDTCORVersion, kGDTCCTSupportSDKVersion];
  [request setValue:userAgent forHTTPHeaderField:@"User-Agent"];
  request.HTTPMethod = @"POST";
  [request setHTTPBody:data];
  return request;
}

#pragma mark - GDTCORUploadPackageProtocol

- (void)packageExpired:(GDTCORUploadPackage *)package {
  dispatch_async(_uploaderQueue, ^{
    [self.currentTask cancel];
    self.currentTask = nil;
    self.currentUploadPackage = nil;
  });
}

#pragma mark - GDTCORLifecycleProtocol

- (void)appWillTerminate:(GDTCORApplication *)application {
  dispatch_sync(_uploaderQueue, ^{
    [self.currentTask cancel];
    [self.currentUploadPackage completeDelivery];
  });
}

@end
