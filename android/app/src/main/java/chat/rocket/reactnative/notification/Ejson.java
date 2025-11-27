package chat.rocket.reactnative.notification;

import android.util.Log;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.Callback;

import chat.rocket.reactnative.SecureStorage;
import com.tencent.mmkv.MMKV;
import com.wix.reactnativenotifications.core.AppLifecycleFacade;
import com.wix.reactnativenotifications.core.AppLifecycleFacadeHolder;

import java.math.BigInteger;

import chat.rocket.reactnative.BuildConfig;

class RNCallback implements Callback {
    public void invoke(Object... args) {

    }
}

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
    
    String host;
    String rid;
    String type;
    Sender sender;
    String messageId;
    String notificationType;
    String messageType;
    String senderName;
    String msg;

    String tmid;

    Content content;

    private ReactApplicationContext reactContext;

    private MMKV mmkv;
    
    private boolean initializationAttempted = false;

    private String TOKEN_KEY = "reactnativemeteor_usertoken-";

    public Ejson() {
        // Don't initialize MMKV in constructor - use lazy initialization instead
    }
    
    /**
     * Lazily initialize MMKV when first needed.
     * 
     * NOTE: MMKV requires ReactApplicationContext (not regular Context) because SecureKeystore
     * needs access to React-specific keystore resources. This means MMKV cannot be initialized
     * before React Native starts.
     */
    private synchronized void ensureMMKVInitialized() {
        if (initializationAttempted) {
            return;
        }
        
        initializationAttempted = true;
        
        // Try to get ReactApplicationContext from available sources
        if (this.reactContext == null) {
            AppLifecycleFacade facade = AppLifecycleFacadeHolder.get();
            if (facade != null) {
                Object runningContext = facade.getRunningReactContext();
                if (runningContext instanceof ReactApplicationContext) {
                    this.reactContext = (ReactApplicationContext) runningContext;
                }
            }
            
            if (this.reactContext == null) {
                this.reactContext = CustomPushNotification.reactApplicationContext;
            }
        }
        
        // Initialize MMKV if context is available
        if (this.reactContext != null && mmkv == null) {
            try {
                MMKV.initialize(this.reactContext);
                SecureStorage secureStorage = new SecureStorage(this.reactContext);

                String alias = Utils.toHex("com.MMKV.default");
                
                String password = secureStorage.getSecureKeyInternal(alias);
                
                
                // Initialize MMKV (works with or without encryption)
                mmkv = MMKV.mmkvWithID("default", MMKV.SINGLE_PROCESS_MODE, password);
            } catch (Exception e) {
                Log.e(TAG, "Failed to initialize MMKV", e);
                mmkv = null;
            }
        } else if (this.reactContext == null) {
            Log.w(TAG, "Cannot initialize MMKV: ReactApplicationContext not available");
        }
    }

    public String getAvatarUri() {
        if (sender == null || sender.username == null || sender.username.isEmpty()) {
            Log.w(TAG, "Cannot generate avatar URI: sender or username is null");
            return null;
        }
        
        String server = serverURL();
        if (server == null || server.isEmpty()) {
            Log.w(TAG, "Cannot generate avatar URI: serverURL is null");
            return null;
        }
        
        String userToken = token();
        String uid = userId();
        
        if (userToken.isEmpty() || uid.isEmpty()) {
            Log.w(TAG, "Cannot generate avatar URI: missing auth credentials (token=" + !userToken.isEmpty() + ", uid=" + !uid.isEmpty() + ")");
            return null;
        }
        
        String uri = server + "/avatar/" + sender.username + "?format=png&size=100&rc_token=" + userToken + "&rc_uid=" + uid;
        
        if (BuildConfig.DEBUG) {
            Log.d(TAG, "Generated avatar URI for user: " + sender.username);
        }
        
        return uri;
    }

    public String token() {
        ensureMMKVInitialized();
        String userId = userId();
        
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
        ensureMMKVInitialized();
        String serverURL = serverURL();
        String key = TOKEN_KEY.concat(serverURL);
        
        if (mmkv == null) {
            Log.e(TAG, "userId() called but MMKV is null");
            return "";
        }
        
        if (serverURL == null) {
            Log.e(TAG, "userId() called but serverURL is null");
            return "";
        }
        
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
        ensureMMKVInitialized();
        String serverURL = serverURL();
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

    static class Content {
        String algorithm;
        String ciphertext;
        String kid;
        String iv;
    }
}