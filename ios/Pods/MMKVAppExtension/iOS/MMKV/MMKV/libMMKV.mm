/*
 * Tencent is pleased to support the open source community by making
 * MMKV available.
 *
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.
 * All rights reserved.
 *
 * Licensed under the BSD 3-Clause License (the "License"); you may not use
 * this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 *       https://opensource.org/licenses/BSD-3-Clause
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#import "MMKV.h"
#import <MMKVCore/MMKV.h>
#import <MMKVCore/MMKVLog.h>
#import <MMKVCore/ScopedLock.hpp>
#import <MMKVCore/ThreadLock.h>
#import <MMKVCore/openssl_md5.h>

#if defined(MMKV_IOS) && !defined(MMKV_IOS_EXTENSION)
#import <UIKit/UIKit.h>
#endif

using namespace std;

static NSMutableDictionary *g_instanceDic = nil;
static mmkv::ThreadLock *g_lock;
static id<MMKVHandler> g_callbackHandler = nil;
static bool g_isLogRedirecting = false;
static NSString *g_basePath = nil;
static NSString *g_groupPath = nil;

#if defined(MMKV_IOS) && !defined(MMKV_IOS_EXTENSION)
static BOOL g_isRunningInAppExtension = NO;
#endif

static void LogHandler(mmkv::MMKVLogLevel level, const char *file, int line, const char *function, NSString *message);
static mmkv::MMKVRecoverStrategic ErrorHandler(const string &mmapID, mmkv::MMKVErrorType errorType);
static void ContentChangeHandler(const string &mmapID);

@implementation MMKV {
    NSString *m_mmapID;
    NSString *m_mmapKey;
    mmkv::MMKV *m_mmkv;
}

#pragma mark - init

// protect from some old code that don't call +initializeMMKV:
+ (void)initialize {
    if (self == MMKV.class) {
        g_instanceDic = [[NSMutableDictionary alloc] init];
        g_lock = new mmkv::ThreadLock();
        g_lock->initialize();

        mmkv::MMKV::minimalInit([self mmkvBasePath].UTF8String);

#if defined(MMKV_IOS) && !defined(MMKV_IOS_EXTENSION)
        // just in case someone forget to set the MMKV_IOS_EXTENSION macro
        if ([[[NSBundle mainBundle] bundlePath] hasSuffix:@".appex"]) {
            g_isRunningInAppExtension = YES;
        }
        if (!g_isRunningInAppExtension) {
            auto appState = [UIApplication sharedApplication].applicationState;
            auto isInBackground = (appState == UIApplicationStateBackground);
            mmkv::MMKV::setIsInBackground(isInBackground);
            MMKVInfo("appState:%ld", (long) appState);

            [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(didEnterBackground) name:UIApplicationDidEnterBackgroundNotification object:nil];
            [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(didBecomeActive) name:UIApplicationDidBecomeActiveNotification object:nil];
        }
#endif
    }
}

+ (NSString *)initializeMMKV:(nullable NSString *)rootDir {
    return [MMKV initializeMMKV:rootDir logLevel:MMKVLogInfo];
}

static BOOL g_hasCalledInitializeMMKV = NO;

+ (NSString *)initializeMMKV:(nullable NSString *)rootDir logLevel:(MMKVLogLevel)logLevel {
    if (g_hasCalledInitializeMMKV) {
        MMKVWarning("already called +initializeMMKV before, ignore this request");
        return [self mmkvBasePath];
    }
    g_hasCalledInitializeMMKV = YES;

    g_basePath = (rootDir != nil) ? rootDir : [self mmkvBasePath];
    mmkv::MMKV::initializeMMKV(g_basePath.UTF8String, (mmkv::MMKVLogLevel) logLevel);

    return [self mmkvBasePath];
}

+ (NSString *)initializeMMKV:(nullable NSString *)rootDir groupDir:(NSString *)groupDir logLevel:(MMKVLogLevel)logLevel {
    auto ret = [MMKV initializeMMKV:rootDir logLevel:logLevel];

    g_groupPath = [groupDir stringByAppendingPathComponent:@"mmkv"];
    MMKVInfo("groupDir: %@", g_groupPath);

    return ret;
}

// a generic purpose instance
+ (instancetype)defaultMMKV {
    return [MMKV mmkvWithID:(@"" DEFAULT_MMAP_ID) cryptKey:nil rootPath:nil mode:MMKVSingleProcess];
}

// any unique ID (com.tencent.xin.pay, etc)
+ (instancetype)mmkvWithID:(NSString *)mmapID {
    return [MMKV mmkvWithID:mmapID cryptKey:nil rootPath:nil mode:MMKVSingleProcess];
}

+ (instancetype)mmkvWithID:(NSString *)mmapID mode:(MMKVMode)mode {
    auto rootPath = (mode == MMKVSingleProcess) ? nil : g_groupPath;
    return [MMKV mmkvWithID:mmapID cryptKey:nil rootPath:rootPath mode:mode];
}

+ (instancetype)mmkvWithID:(NSString *)mmapID cryptKey:(NSData *)cryptKey {
    return [MMKV mmkvWithID:mmapID cryptKey:cryptKey rootPath:nil mode:MMKVSingleProcess];
}

+ (instancetype)mmkvWithID:(NSString *)mmapID cryptKey:(nullable NSData *)cryptKey mode:(MMKVMode)mode {
    auto rootPath = (mode == MMKVSingleProcess) ? nil : g_groupPath;
    return [MMKV mmkvWithID:mmapID cryptKey:cryptKey rootPath:rootPath mode:mode];
}

+ (instancetype)mmkvWithID:(NSString *)mmapID rootPath:(nullable NSString *)rootPath {
    return [MMKV mmkvWithID:mmapID cryptKey:nil rootPath:rootPath mode:MMKVSingleProcess];
}

+ (instancetype)mmkvWithID:(NSString *)mmapID relativePath:(nullable NSString *)relativePath {
    return [MMKV mmkvWithID:mmapID cryptKey:nil rootPath:relativePath mode:MMKVSingleProcess];
}

+ (instancetype)mmkvWithID:(NSString *)mmapID cryptKey:(NSData *)cryptKey rootPath:(nullable NSString *)rootPath {
    return [MMKV mmkvWithID:mmapID cryptKey:cryptKey rootPath:rootPath mode:MMKVSingleProcess];
}

+ (instancetype)mmkvWithID:(NSString *)mmapID cryptKey:(nullable NSData *)cryptKey relativePath:(nullable NSString *)relativePath {
    return [MMKV mmkvWithID:mmapID cryptKey:cryptKey rootPath:relativePath mode:MMKVSingleProcess];
}

// relatePath and MMKVMultiProcess mode can't be set at the same time, so we hide this method from public
+ (instancetype)mmkvWithID:(NSString *)mmapID cryptKey:(NSData *)cryptKey rootPath:(nullable NSString *)rootPath mode:(MMKVMode)mode {
    if (!g_hasCalledInitializeMMKV) {
        MMKVError("MMKV not initialized properly, must call +initializeMMKV: in main thread before calling any other MMKV methods");
    }
    if (mmapID.length <= 0) {
        return nil;
    }

    SCOPED_LOCK(g_lock);

    if (mode == MMKVMultiProcess) {
        if (!rootPath) {
            rootPath = g_groupPath;
        }
        if (!rootPath) {
            MMKVError("Getting a multi-process MMKV [%@] without setting groupDir makes no sense", mmapID);
            MMKV_ASSERT(0);
        }
    }
    NSString *kvKey = [MMKV mmapKeyWithMMapID:mmapID rootPath:rootPath];
    MMKV *kv = [g_instanceDic objectForKey:kvKey];
    if (kv == nil) {
        kv = [[MMKV alloc] initWithMMapID:mmapID cryptKey:cryptKey rootPath:rootPath mode:mode];
        if (!kv->m_mmkv) {
            return nil;
        }
        kv->m_mmapKey = kvKey;
        [g_instanceDic setObject:kv forKey:kvKey];
    }
    return kv;
}

- (instancetype)initWithMMapID:(NSString *)mmapID cryptKey:(NSData *)cryptKey rootPath:(NSString *)rootPath mode:(MMKVMode)mode {
    if (self = [super init]) {
        string pathTmp;
        if (rootPath.length > 0) {
            pathTmp = rootPath.UTF8String;
        }
        string cryptKeyTmp;
        if (cryptKey.length > 0) {
            cryptKeyTmp = string((char *) cryptKey.bytes, cryptKey.length);
        }
        string *rootPathPtr = pathTmp.empty() ? nullptr : &pathTmp;
        string *cryptKeyPtr = cryptKeyTmp.empty() ? nullptr : &cryptKeyTmp;
        m_mmkv = mmkv::MMKV::mmkvWithID(mmapID.UTF8String, (mmkv::MMKVMode) mode, cryptKeyPtr, rootPathPtr);
        if (!m_mmkv) {
            return self;
        }
        m_mmapID = [NSString stringWithUTF8String:m_mmkv->mmapID().c_str()];

#if defined(MMKV_IOS) && !defined(MMKV_IOS_EXTENSION)
        if (!g_isRunningInAppExtension) {
            [[NSNotificationCenter defaultCenter] addObserver:self
                                                     selector:@selector(onMemoryWarning)
                                                         name:UIApplicationDidReceiveMemoryWarningNotification
                                                       object:nil];
        }
#endif
    }
    return self;
}

- (void)dealloc {
    [self clearMemoryCache];

    [[NSNotificationCenter defaultCenter] removeObserver:self];
}

#pragma mark - Application state

#if defined(MMKV_IOS) && !defined(MMKV_IOS_EXTENSION)
- (void)onMemoryWarning {
    MMKVInfo("cleaning on memory warning %@", m_mmapID);

    [self clearMemoryCache];
}

+ (void)didEnterBackground {
    mmkv::MMKV::setIsInBackground(true);
    MMKVInfo("isInBackground:%d", true);
}

+ (void)didBecomeActive {
    mmkv::MMKV::setIsInBackground(false);
    MMKVInfo("isInBackground:%d", false);
}
#endif

- (void)clearAll {
    m_mmkv->clearAll();
}

- (void)clearMemoryCache {
    if (m_mmkv) {
        m_mmkv->clearMemoryCache();
    }
}

- (void)close {
    SCOPED_LOCK(g_lock);
    MMKVInfo("closing %@", m_mmapID);

    m_mmkv->close();
    m_mmkv = nullptr;

    [g_instanceDic removeObjectForKey:m_mmapKey];
}

- (void)trim {
    m_mmkv->trim();
}

#pragma mark - encryption & decryption

#ifndef MMKV_DISABLE_CRYPT

- (nullable NSData *)cryptKey {
    auto str = m_mmkv->cryptKey();
    if (str.length() > 0) {
        return [NSData dataWithBytes:str.data() length:str.length()];
    }
    return nil;
}

- (BOOL)reKey:(nullable NSData *)newKey {
    string key;
    if (newKey.length > 0) {
        key = string((char *) newKey.bytes, newKey.length);
    }
    return m_mmkv->reKey(key);
}

- (void)checkReSetCryptKey:(nullable NSData *)cryptKey {
    if (cryptKey.length > 0) {
        string key = string((char *) cryptKey.bytes, cryptKey.length);
        m_mmkv->checkReSetCryptKey(&key);
    } else {
        m_mmkv->checkReSetCryptKey(nullptr);
    }
}

#else

- (nullable NSData *)cryptKey {
    return nil;
}

- (BOOL)reKey:(nullable NSData *)newKey {
    return NO;
}

- (void)checkReSetCryptKey:(nullable NSData *)cryptKey {
}

#endif // MMKV_DISABLE_CRYPT

#pragma mark - set & get

- (BOOL)setObject:(nullable NSObject<NSCoding> *)object forKey:(NSString *)key {
    return m_mmkv->set(object, key);
}

- (BOOL)setBool:(BOOL)value forKey:(NSString *)key {
    return m_mmkv->set((bool) value, key);
}

- (BOOL)setInt32:(int32_t)value forKey:(NSString *)key {
    return m_mmkv->set(value, key);
}

- (BOOL)setUInt32:(uint32_t)value forKey:(NSString *)key {
    return m_mmkv->set(value, key);
}

- (BOOL)setInt64:(int64_t)value forKey:(NSString *)key {
    return m_mmkv->set(value, key);
}

- (BOOL)setUInt64:(uint64_t)value forKey:(NSString *)key {
    return m_mmkv->set(value, key);
}

- (BOOL)setFloat:(float)value forKey:(NSString *)key {
    return m_mmkv->set(value, key);
}

- (BOOL)setDouble:(double)value forKey:(NSString *)key {
    return m_mmkv->set(value, key);
}

- (BOOL)setString:(NSString *)value forKey:(NSString *)key {
    return [self setObject:value forKey:key];
}

- (BOOL)setDate:(NSDate *)value forKey:(NSString *)key {
    return [self setObject:value forKey:key];
}

- (BOOL)setData:(NSData *)value forKey:(NSString *)key {
    return [self setObject:value forKey:key];
}

- (id)getObjectOfClass:(Class)cls forKey:(NSString *)key {
    return m_mmkv->getObject(key, cls);
}

- (BOOL)getBoolForKey:(NSString *)key {
    return [self getBoolForKey:key defaultValue:FALSE];
}
- (BOOL)getBoolForKey:(NSString *)key defaultValue:(BOOL)defaultValue {
    return m_mmkv->getBool(key, defaultValue);
}

- (int32_t)getInt32ForKey:(NSString *)key {
    return [self getInt32ForKey:key defaultValue:0];
}
- (int32_t)getInt32ForKey:(NSString *)key defaultValue:(int32_t)defaultValue {
    return m_mmkv->getInt32(key, defaultValue);
}

- (uint32_t)getUInt32ForKey:(NSString *)key {
    return [self getUInt32ForKey:key defaultValue:0];
}
- (uint32_t)getUInt32ForKey:(NSString *)key defaultValue:(uint32_t)defaultValue {
    return m_mmkv->getUInt32(key, defaultValue);
}

- (int64_t)getInt64ForKey:(NSString *)key {
    return [self getInt64ForKey:key defaultValue:0];
}
- (int64_t)getInt64ForKey:(NSString *)key defaultValue:(int64_t)defaultValue {
    return m_mmkv->getInt64(key, defaultValue);
}

- (uint64_t)getUInt64ForKey:(NSString *)key {
    return [self getUInt64ForKey:key defaultValue:0];
}
- (uint64_t)getUInt64ForKey:(NSString *)key defaultValue:(uint64_t)defaultValue {
    return m_mmkv->getUInt64(key, defaultValue);
}

- (float)getFloatForKey:(NSString *)key {
    return [self getFloatForKey:key defaultValue:0];
}
- (float)getFloatForKey:(NSString *)key defaultValue:(float)defaultValue {
    return m_mmkv->getFloat(key, defaultValue);
}

- (double)getDoubleForKey:(NSString *)key {
    return [self getDoubleForKey:key defaultValue:0];
}
- (double)getDoubleForKey:(NSString *)key defaultValue:(double)defaultValue {
    return m_mmkv->getDouble(key, defaultValue);
}

- (nullable NSString *)getStringForKey:(NSString *)key {
    return [self getStringForKey:key defaultValue:nil];
}
- (nullable NSString *)getStringForKey:(NSString *)key defaultValue:(nullable NSString *)defaultValue {
    if (key.length <= 0) {
        return defaultValue;
    }
    NSString *valueString = [self getObjectOfClass:NSString.class forKey:key];
    if (!valueString) {
        valueString = defaultValue;
    }
    return valueString;
}

- (nullable NSDate *)getDateForKey:(NSString *)key {
    return [self getDateForKey:key defaultValue:nil];
}
- (nullable NSDate *)getDateForKey:(NSString *)key defaultValue:(nullable NSDate *)defaultValue {
    if (key.length <= 0) {
        return defaultValue;
    }
    NSDate *valueDate = [self getObjectOfClass:NSDate.class forKey:key];
    if (!valueDate) {
        valueDate = defaultValue;
    }
    return valueDate;
}

- (nullable NSData *)getDataForKey:(NSString *)key {
    return [self getDataForKey:key defaultValue:nil];
}
- (nullable NSData *)getDataForKey:(NSString *)key defaultValue:(nullable NSData *)defaultValue {
    if (key.length <= 0) {
        return defaultValue;
    }
    NSData *valueData = [self getObjectOfClass:NSData.class forKey:key];
    if (!valueData) {
        valueData = defaultValue;
    }
    return valueData;
}

- (size_t)getValueSizeForKey:(NSString *)key {
    return m_mmkv->getValueSize(key, false);
}

- (int32_t)writeValueForKey:(NSString *)key toBuffer:(NSMutableData *)buffer {
    return m_mmkv->writeValueToBuffer(key, buffer.mutableBytes, static_cast<int32_t>(buffer.length));
}

#pragma mark - enumerate

- (BOOL)containsKey:(NSString *)key {
    return m_mmkv->containsKey(key);
}

- (size_t)count {
    return m_mmkv->count();
}

- (size_t)totalSize {
    return m_mmkv->totalSize();
}

- (size_t)actualSize {
    return m_mmkv->actualSize();
}

- (void)enumerateKeys:(void (^)(NSString *key, BOOL *stop))block {
    m_mmkv->enumerateKeys(block);
}

- (NSArray *)allKeys {
    return m_mmkv->allKeys();
}

- (void)removeValueForKey:(NSString *)key {
    m_mmkv->removeValueForKey(key);
}

- (void)removeValuesForKeys:(NSArray *)arrKeys {
    m_mmkv->removeValuesForKeys(arrKeys);
}

#pragma mark - Boring stuff

- (void)sync {
    m_mmkv->sync(mmkv::MMKV_SYNC);
}

- (void)async {
    m_mmkv->sync(mmkv::MMKV_ASYNC);
}

- (void)checkContentChanged {
    m_mmkv->checkContentChanged();
}

+ (void)onAppTerminate {
    SCOPED_LOCK(g_lock);

    [g_instanceDic removeAllObjects];

    mmkv::MMKV::onExit();
}

+ (NSString *)mmkvBasePath {
    if (g_basePath.length > 0) {
        return g_basePath;
    }

    NSArray *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
    NSString *documentPath = (NSString *) [paths firstObject];
    if ([documentPath length] > 0) {
        g_basePath = [documentPath stringByAppendingPathComponent:@"mmkv"];
        return g_basePath;
    } else {
        return @"";
    }
}

+ (void)setMMKVBasePath:(NSString *)basePath {
    if (basePath.length > 0) {
        g_basePath = basePath;
        [MMKV initializeMMKV:basePath];

        // still warn about it
        g_hasCalledInitializeMMKV = NO;

        MMKVInfo("set MMKV base path to: %@", g_basePath);
    }
}

static NSString *md5(NSString *value) {
    uint8_t md[MD5_DIGEST_LENGTH] = {};
    char tmp[3] = {}, buf[33] = {};
    auto data = [value dataUsingEncoding:NSUTF8StringEncoding];
    openssl::MD5((uint8_t *) data.bytes, data.length, md);
    for (auto ch : md) {
        snprintf(tmp, sizeof(tmp), "%2.2x", ch);
        strcat(buf, tmp);
    }
    return [NSString stringWithCString:buf encoding:NSASCIIStringEncoding];
}

+ (NSString *)mmapKeyWithMMapID:(NSString *)mmapID rootPath:(nullable NSString *)rootPath {
    NSString *string = nil;
    if ([rootPath length] > 0 && [rootPath isEqualToString:[MMKV mmkvBasePath]] == NO) {
        string = md5([rootPath stringByAppendingPathComponent:mmapID]);
    } else {
        string = mmapID;
    }
    MMKVDebug("mmapKey: %@", string);
    return string;
}

+ (BOOL)isFileValid:(NSString *)mmapID {
    return [self isFileValid:mmapID rootPath:nil];
}

+ (BOOL)isFileValid:(NSString *)mmapID rootPath:(nullable NSString *)path {
    if (mmapID.length > 0) {
        if (path.length > 0) {
            string rootPath(path.UTF8String);
            return mmkv::MMKV::isFileValid(mmapID.UTF8String, &rootPath);
        } else {
            return mmkv::MMKV::isFileValid(mmapID.UTF8String, nullptr);
        }
    }
    return NO;
}

+ (void)registerHandler:(id<MMKVHandler>)handler {
    SCOPED_LOCK(g_lock);
    g_callbackHandler = handler;

    if ([g_callbackHandler respondsToSelector:@selector(mmkvLogWithLevel:file:line:func:message:)]) {
        g_isLogRedirecting = true;
        mmkv::MMKV::registerLogHandler(LogHandler);
    }
    if ([g_callbackHandler respondsToSelector:@selector(onMMKVCRCCheckFail:)] ||
        [g_callbackHandler respondsToSelector:@selector(onMMKVFileLengthError:)]) {
        mmkv::MMKV::registerErrorHandler(ErrorHandler);
    }
    if ([g_callbackHandler respondsToSelector:@selector(onMMKVContentChange:)]) {
        mmkv::MMKV::registerContentChangeHandler(ContentChangeHandler);
    }
}

+ (void)unregiserHandler {
    SCOPED_LOCK(g_lock);

    g_isLogRedirecting = false;
    g_callbackHandler = nil;

    mmkv::MMKV::unRegisterLogHandler();
    mmkv::MMKV::unRegisterErrorHandler();
    mmkv::MMKV::unRegisterContentChangeHandler();
}

+ (void)setLogLevel:(MMKVLogLevel)logLevel {
    mmkv::MMKV::setLogLevel((mmkv::MMKVLogLevel) logLevel);
}

- (uint32_t)migrateFromUserDefaults:(NSUserDefaults *)userDaults {
    NSDictionary *dic = [userDaults dictionaryRepresentation];
    if (dic.count <= 0) {
        MMKVInfo("migrate data fail, userDaults is nil or empty");
        return 0;
    }
    __block uint32_t count = 0;
    [dic enumerateKeysAndObjectsUsingBlock:^(id _Nonnull key, id _Nonnull obj, BOOL *_Nonnull stop) {
        if ([key isKindOfClass:[NSString class]]) {
            NSString *stringKey = key;
            if ([MMKV tranlateData:obj key:stringKey kv:self]) {
                count++;
            }
        } else {
            MMKVWarning("unknown type of key:%@", key);
        }
    }];
    return count;
}

+ (BOOL)tranlateData:(id)obj key:(NSString *)key kv:(MMKV *)kv {
    if ([obj isKindOfClass:[NSString class]]) {
        return [kv setString:obj forKey:key];
    } else if ([obj isKindOfClass:[NSData class]]) {
        return [kv setData:obj forKey:key];
    } else if ([obj isKindOfClass:[NSDate class]]) {
        return [kv setDate:obj forKey:key];
    } else if ([obj isKindOfClass:[NSNumber class]]) {
        NSNumber *num = obj;
        CFNumberType numberType = CFNumberGetType((CFNumberRef) obj);
        switch (numberType) {
            case kCFNumberCharType:
            case kCFNumberSInt8Type:
            case kCFNumberSInt16Type:
            case kCFNumberSInt32Type:
            case kCFNumberIntType:
            case kCFNumberShortType:
                return [kv setInt32:num.intValue forKey:key];
            case kCFNumberSInt64Type:
            case kCFNumberLongType:
            case kCFNumberNSIntegerType:
            case kCFNumberLongLongType:
                return [kv setInt64:num.longLongValue forKey:key];
            case kCFNumberFloat32Type:
                return [kv setFloat:num.floatValue forKey:key];
            case kCFNumberFloat64Type:
            case kCFNumberDoubleType:
                return [kv setDouble:num.doubleValue forKey:key];
            default:
                MMKVWarning("unknown number type:%ld, key:%@", (long) numberType, key);
                return NO;
        }
    } else if ([obj isKindOfClass:[NSArray class]] || [obj isKindOfClass:[NSDictionary class]]) {
        return [kv setObject:obj forKey:key];
    } else {
        MMKVWarning("unknown type of key:%@", key);
    }
    return NO;
}

@end

#pragma makr - callbacks

static void LogHandler(mmkv::MMKVLogLevel level, const char *file, int line, const char *function, NSString *message) {
    [g_callbackHandler mmkvLogWithLevel:(MMKVLogLevel) level file:file line:line func:function message:message];
}

static mmkv::MMKVRecoverStrategic ErrorHandler(const string &mmapID, mmkv::MMKVErrorType errorType) {
    if (errorType == mmkv::MMKVCRCCheckFail) {
        if ([g_callbackHandler respondsToSelector:@selector(onMMKVCRCCheckFail:)]) {
            auto ret = [g_callbackHandler onMMKVCRCCheckFail:[NSString stringWithUTF8String:mmapID.c_str()]];
            return (mmkv::MMKVRecoverStrategic) ret;
        }
    } else {
        if ([g_callbackHandler respondsToSelector:@selector(onMMKVFileLengthError:)]) {
            auto ret = [g_callbackHandler onMMKVFileLengthError:[NSString stringWithUTF8String:mmapID.c_str()]];
            return (mmkv::MMKVRecoverStrategic) ret;
        }
    }
    return mmkv::OnErrorDiscard;
}

static void ContentChangeHandler(const string &mmapID) {
    if ([g_callbackHandler respondsToSelector:@selector(onMMKVContentChange:)]) {
        [g_callbackHandler onMMKVContentChange:[NSString stringWithUTF8String:mmapID.c_str()]];
    }
}
