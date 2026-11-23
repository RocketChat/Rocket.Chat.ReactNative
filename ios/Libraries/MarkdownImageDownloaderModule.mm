#import <React/RCTBridgeModule.h>
#import <SSLPinning/SSLPinning.h>
#import <ReactNativeEnrichedMarkdown/ENRMImageDownloader.h>

@interface MarkdownImageDownloaderModule : NSObject <NativeMarkdownImageDownloaderSpec>
@end

@implementation MarkdownImageDownloaderModule

RCT_EXPORT_MODULE(MarkdownImageDownloader)

- (void)setUserAgent:(NSString *)userAgent
{
  [ENRMImageDownloader setUserAgent:userAgent];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeMarkdownImageDownloaderSpecJSI>(params);
}

@end
