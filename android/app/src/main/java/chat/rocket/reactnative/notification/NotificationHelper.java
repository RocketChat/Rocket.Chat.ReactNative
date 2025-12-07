package chat.rocket.reactnative.notification;

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
}

