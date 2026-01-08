package chat.rocket.reactnative.notification;

import android.util.Log;

import com.tencent.mmkv.MMKV;

import java.math.BigInteger;
import java.net.URLEncoder;
import java.io.UnsupportedEncodingException;

import chat.rocket.reactnative.BuildConfig;
import chat.rocket.reactnative.storage.MMKVKeyManager;

class Utils {
    static public String toHex(String arg) {
        try {
            return String.format("%x", new BigInteger(1, arg.getBytes("UTF-8")));
        } catch (Exception e) {
            return "";
        }
    }
}

public class Ejson {
    private static final String TAG = "RocketChat.Ejson";
    private static final String TOKEN_KEY = "reactnativemeteor_usertoken-";
    
    String host;
    String rid;
    String type;
    Sender sender;
    Caller caller; // For video conf notifications
    String messageId;
    String callId; // For video conf notifications
    String notificationType;
    String messageType;
    String senderName;
    String name; // Room name for groups/channels
    String fname; // Room friendly name for groups/channels
    String msg;
    Integer status; // For video conf: 0=incoming, 4=cancelled

    String tmid;
    String prid;
    Content content;

    private MMKV getMMKV() {
        String encryptionKey = MMKVKeyManager.getEncryptionKey();
        if (encryptionKey != null && !encryptionKey.isEmpty()) {
            return MMKV.mmkvWithID("default", MMKV.SINGLE_PROCESS_MODE, encryptionKey);
        }
        // Fallback to no encryption if key is not available
        // This can happen if Keystore is unavailable (e.g., device locked/Direct Boot)
        Log.w(TAG, "MMKV encryption key not available, opening without encryption");
        return MMKV.mmkvWithID("default", MMKV.SINGLE_PROCESS_MODE);
    }

    /**
     * Helper method to build avatar URI from avatar path.
     * Validates server URL and credentials, then constructs the full URI.
     */
    private String buildAvatarUri(String avatarPath, String errorContext) {
        String server = serverURL();
        if (server == null || server.isEmpty()) {
            Log.w(TAG, "Cannot generate " + errorContext + " avatar URI: serverURL is null");
            return null;
        }
        
        String userToken = token();
        String uid = userId();
        
        if (userToken.isEmpty() || uid.isEmpty()) {
            Log.w(TAG, "Cannot generate " + errorContext + " avatar URI: missing auth credentials");
            return null;
        }
        
        return server + avatarPath + "?format=png&size=100&rc_token=" + userToken + "&rc_uid=" + uid;
    }

    public String getAvatarUri() {
        String avatarPath;
        
        // For DMs and threads, show sender's avatar; for groups/channels, show room avatar
        if ("d".equals(type) || tmid != null) {
            // Direct message or thread: use sender's avatar
            if (sender == null || sender.username == null || sender.username.isEmpty()) {
                Log.w(TAG, "Cannot generate avatar URI: sender or username is null");
                return null;
            }
            try {
                avatarPath = "/avatar/" + URLEncoder.encode(sender.username, "UTF-8");
            } catch (UnsupportedEncodingException e) {
                Log.e(TAG, "Failed to encode username", e);
                return null;
            }
        } else {
            // Group/Channel/Livechat: use room avatar
            if (rid == null || rid.isEmpty()) {
                Log.w(TAG, "Cannot generate avatar URI: rid is null for non-DM");
                return null;
            }
            try {
                avatarPath = "/avatar/room/" + URLEncoder.encode(rid, "UTF-8");
            } catch (UnsupportedEncodingException e) {
                Log.e(TAG, "Failed to encode rid", e);
                return null;
            }
        }
        
        return buildAvatarUri(avatarPath, "");
    }

    /**
     * Generates avatar URI for video conference caller.
     * Returns null if caller username is not available (username is required for avatar endpoint).
     */
    public String getCallerAvatarUri() {
        // Check if caller exists and has username (required - /avatar/{userId} endpoint doesn't exist)
        if (caller == null || caller.username == null || caller.username.isEmpty()) {
            Log.w(TAG, "Cannot generate caller avatar URI: caller or username is null");
            return null;
        }
        
        try {
            String avatarPath = "/avatar/" + URLEncoder.encode(caller.username, "UTF-8");
            return buildAvatarUri(avatarPath, "caller");
        } catch (UnsupportedEncodingException e) {
            Log.e(TAG, "Failed to encode caller username", e);
            return null;
        }
    }

    public String token() {
        String userId = userId();
        MMKV mmkv = getMMKV();
        
        if (mmkv == null) {
            Log.e(TAG, "token() called but MMKV is null");
            return "";
        }
        
        if (userId == null || userId.isEmpty()) {
            Log.w(TAG, "token() called but userId is null or empty");
            return "";
        }
        
        String key = TOKEN_KEY.concat(userId);
        if (BuildConfig.DEBUG) {
            Log.d(TAG, "Looking up token with key: " + key);
        }
        
        String token = mmkv.decodeString(key);
        
        if (token == null || token.isEmpty()) {
            Log.w(TAG, "No token found in MMKV for userId");
        } else if (BuildConfig.DEBUG) {
            Log.d(TAG, "Successfully retrieved token from MMKV");
        }
        
        return token != null ? token : "";
    }

    public String userId() {
        String serverURL = serverURL();
        
        if (serverURL == null) {
            Log.e(TAG, "userId() called but serverURL is null");
            return "";
        }
        
        MMKV mmkv = getMMKV();
        
        if (mmkv == null) {
            Log.e(TAG, "userId() called but MMKV is null");
            return "";
        }
        
        String key = TOKEN_KEY.concat(serverURL);
        
        if (BuildConfig.DEBUG) {
            Log.d(TAG, "Looking up userId with key: " + key);
        }
        
        String userId = mmkv.decodeString(key);
        
        if (userId == null || userId.isEmpty()) {
            Log.w(TAG, "No userId found in MMKV for server: " + NotificationHelper.sanitizeUrl(serverURL));
            
            // Only list keys in debug builds for diagnostics
            if (BuildConfig.DEBUG) {
                try {
                    String[] allKeys = mmkv.allKeys();
                    if (allKeys != null && allKeys.length > 0) {
                        Log.d(TAG, "Available MMKV keys count: " + allKeys.length);
                        // Log only keys that match the TOKEN_KEY pattern for security
                        for (String k : allKeys) {
                            if (k != null && k.startsWith("reactnativemeteor_usertoken")) {
                                Log.d(TAG, "Found auth key: " + k);
                            }
                        }
                    } else {
                        Log.w(TAG, "MMKV has no keys stored");
                    }
                } catch (Exception e) {
                    Log.e(TAG, "Error listing MMKV keys", e);
                }
            }
        } else if (BuildConfig.DEBUG) {
            Log.d(TAG, "Successfully retrieved userId from MMKV");
        }
        
        return userId != null ? userId : "";
    }

    public String privateKey() {
        String serverURL = serverURL();
        MMKV mmkv = getMMKV();
        if (mmkv != null && serverURL != null) {
            return mmkv.decodeString(serverURL.concat("-RC_E2E_PRIVATE_KEY"));
        }
        return null;
    }

    public String serverURL() {
        String url = this.host;
        if (url != null && url.endsWith("/")) {
            url = url.substring(0, url.length() - 1);
        }
        return url;
    }

    static class Sender {
        String _id;
        String username;
        String name;
    }

    static class Caller {
        String _id;
        String name;
        String username;
    }

    static class Content {
        String algorithm;
        String ciphertext;
        String kid;
        String iv;
    }
}
