package chat.rocket.reactnative.notification;

import android.content.Context;
import android.graphics.Bitmap;
import android.util.Log;

import androidx.annotation.Nullable;

import com.bumptech.glide.Glide;
import com.bumptech.glide.load.resource.bitmap.RoundedCorners;
import com.bumptech.glide.request.RequestOptions;

import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

import chat.rocket.reactnative.BuildConfig;

/**
 * Shared utility methods for notification handling
 */
public class NotificationHelper {
    
    /**
     * Sanitize URL for logging by removing sensitive information
     * @param url The URL to sanitize
     * @return Full URL in debug builds, generic placeholder in production
     */
    public static String sanitizeUrl(String url) {
        if (url == null) {
            return "[null]";
        }
        // In debug builds, show full URL for debugging
        // In production, hide workspace URLs for privacy
        if (BuildConfig.DEBUG) {
            return url;
        }
        return "[workspace]";
    }
    
    /**
     * Get the User-Agent string for API requests
     * Format: RC Mobile; android {systemVersion}; v{appVersion} ({buildNumber})
     * @return User-Agent string
     */
    public static String getUserAgent() {
        String systemVersion = android.os.Build.VERSION.RELEASE;
        String appVersion = BuildConfig.VERSION_NAME;
        int buildNumber = BuildConfig.VERSION_CODE;
        return String.format("RC Mobile; android %s; v%s (%d)", systemVersion, appVersion, buildNumber);
    }
    
    /**
     * Fetches avatar bitmap from URI using Glide.
     * Uses a 3-second timeout to avoid blocking the FCM service for too long.
     * 
     * @param context The application context
     * @param uri The avatar URI to fetch
     * @param fallbackIcon Optional fallback bitmap (null if no fallback desired)
     * @return Avatar bitmap, or fallbackIcon if fetch fails, or null if no fallback provided
     */
    public static Bitmap fetchAvatarBitmap(Context context, String uri, @Nullable Bitmap fallbackIcon) {
        if (uri == null || uri.isEmpty()) {
            return fallbackIcon;
        }
        
        try {
            // Use a 3-second timeout to avoid blocking the FCM service for too long
            // FCM has a 10-second limit, so we need to fail fast and use fallback icon
            Bitmap avatar = Glide.with(context)
                    .asBitmap()
                    .apply(RequestOptions.bitmapTransform(new RoundedCorners(10)))
                    .load(uri)
                    .submit(100, 100)
                    .get(3, TimeUnit.SECONDS);
            
            return avatar != null ? avatar : fallbackIcon;
        } catch (final ExecutionException | InterruptedException | TimeoutException e) {
            Log.e("NotificationHelper", "Failed to fetch avatar", e);
            if (e instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            return fallbackIcon;
        }
    }
}

