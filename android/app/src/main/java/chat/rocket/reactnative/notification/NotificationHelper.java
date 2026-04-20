package chat.rocket.reactnative.notification;

import android.content.Context;
import android.graphics.Bitmap;
import android.util.Log;

import androidx.annotation.Nullable;

import com.bumptech.glide.Glide;
import com.bumptech.glide.load.model.GlideUrl;
import com.bumptech.glide.load.resource.bitmap.RoundedCorners;
import com.bumptech.glide.request.RequestOptions;

import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
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
     * Build a Glide load model for an avatar URL, appending rc_token/rc_uid as query
     * parameters when the Ejson has credentials. Mirrors the JS codebase's avatar auth
     * convention (getAvatarUrl.ts, Reply.tsx, Urls.tsx).
     */
    public static Object avatarLoadModel(String uri, @Nullable Ejson ejson) {
        if (uri == null || uri.isEmpty()) {
            return uri;
        }
        String rcToken = ejson != null ? ejson.token() : "";
        String rcUid = ejson != null ? ejson.userId() : "";
        if (rcToken.isEmpty() || rcUid.isEmpty()) {
            return uri;
        }
        String separator = uri.contains("?") ? "&" : "?";
        try {
            String authed = uri + separator
                    + "rc_token=" + URLEncoder.encode(rcToken, "UTF-8")
                    + "&rc_uid=" + URLEncoder.encode(rcUid, "UTF-8");
            return new GlideUrl(authed);
        } catch (UnsupportedEncodingException e) {
            Log.e("NotificationHelper", "Failed to encode avatar credentials", e);
            return uri;
        }
    }

    /**
     * Fetches avatar bitmap with a 3-second timeout so we don't block the FCM service
     * past its 10-second lifetime. Returns fallbackIcon on failure.
     */
    public static Bitmap fetchAvatarBitmap(
            Context context,
            String uri,
            @Nullable Ejson ejson,
            @Nullable Bitmap fallbackIcon) {
        if (uri == null || uri.isEmpty()) {
            return fallbackIcon;
        }

        Object loadModel = avatarLoadModel(uri, ejson);

        try {
            // Use a 3-second timeout to avoid blocking the FCM service for too long
            // FCM has a 10-second limit, so we need to fail fast and use fallback icon
            Bitmap avatar = Glide.with(context)
                    .asBitmap()
                    .apply(RequestOptions.bitmapTransform(new RoundedCorners(10)))
                    .load(loadModel)
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

