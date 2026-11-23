package chat.rocket.reactnative.networking

import com.facebook.react.bridge.ReactApplicationContext
import com.swmansion.enriched.markdown.utils.text.ImageDownloader

class MarkdownImageDownloaderModule(reactContext: ReactApplicationContext) :
    NativeMarkdownImageDownloaderSpec(reactContext) {

    override fun setUserAgent(userAgent: String) {
        ImageDownloader.setUserAgent(userAgent)
    }
}
