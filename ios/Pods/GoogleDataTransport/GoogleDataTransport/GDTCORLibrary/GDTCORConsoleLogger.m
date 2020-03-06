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

#import "GDTCORLibrary/Public/GDTCORConsoleLogger.h"

/** The console logger prefix. */
static NSString *kGDTCORConsoleLogger = @"[GoogleDataTransport]";

NSString *GDTCORMessageCodeEnumToString(GDTCORMessageCode code) {
  return [[NSString alloc] initWithFormat:@"I-GDTCOR%06ld", (long)code];
}

void GDTCORLog(GDTCORMessageCode code, NSString *format, ...) {
// Don't log anything in not debug builds.
#if !NDEBUG
  NSString *logFormat = [NSString stringWithFormat:@"%@[%@] %@", kGDTCORConsoleLogger,
                                                   GDTCORMessageCodeEnumToString(code), format];
  va_list args;
  va_start(args, format);
  NSLogv(logFormat, args);
  va_end(args);
#endif  // !NDEBUG
}
