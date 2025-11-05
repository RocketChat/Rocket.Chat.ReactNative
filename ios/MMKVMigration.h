//
//  MMKVMigration.h
//  RocketChatRN
//
//  MMKV Migration - reads encrypted old MMKV data and migrates to new storage
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface MMKVMigration : NSObject

+ (void)migrate;

@end

NS_ASSUME_NONNULL_END

