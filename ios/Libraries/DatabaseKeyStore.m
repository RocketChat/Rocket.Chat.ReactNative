#import <React/RCTBridgeModule.h>

// Bridging file: exposes the Swift DatabaseKeyStore class to React Native's bridge.
// The Swift class self-registers via RCTBridgeModule — this file provides the
// RCT_EXTERN_MODULE declaration so the bridge sees the JS-facing Promise methods.

RCT_EXTERN_MODULE(DatabaseKeyStore, NSObject)

RCT_EXTERN_METHOD(getItem:(NSString *)key
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(setItem:(NSString *)key
                  value:(NSString *)value
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(removeItem:(NSString *)key
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
