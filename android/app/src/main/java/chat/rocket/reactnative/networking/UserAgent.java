package chat.rocket.reactnative.networking;

import chat.rocket.reactnative.BuildConfig;

/**
 * Shared User-Agent for native Android HTTP requests.
 */
public class UserAgent {
    public static String get() {
        String systemVersion = android.os.Build.VERSION.RELEASE;
        String appVersion = BuildConfig.VERSION_NAME;
        int buildNumber = BuildConfig.VERSION_CODE;
        return String.format("RC Mobile; android %s; v%s (%d)", systemVersion, appVersion, buildNumber);
    }
}
