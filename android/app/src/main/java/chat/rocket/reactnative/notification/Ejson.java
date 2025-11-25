package chat.rocket.reactnative.notification;

import android.util.Log;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.Callback;

import chat.rocket.reactnative.SecureStorage;
import com.tencent.mmkv.MMKV;
import com.wix.reactnativenotifications.core.AppLifecycleFacade;
import com.wix.reactnativenotifications.core.AppLifecycleFacadeHolder;

import java.math.BigInteger;

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
    private void ensureMMKVInitialized() {
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
        if (type == null) {
            return null;
        }
        return serverURL() + "/avatar/" + this.sender.username + "?rc_token=" + token() + "&rc_uid=" + userId();
    }

    public String token() {
        ensureMMKVInitialized();
        String userId = userId();
        if (mmkv != null && userId != null) {
            return mmkv.decodeString(TOKEN_KEY.concat(userId));
        }
        return "";
    }

    public String userId() {
        ensureMMKVInitialized();
        String serverURL = serverURL();
        if (mmkv != null && serverURL != null) {
            return mmkv.decodeString(TOKEN_KEY.concat(serverURL));
        }
        return "";
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
