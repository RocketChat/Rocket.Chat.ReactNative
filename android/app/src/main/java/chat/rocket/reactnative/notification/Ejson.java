package chat.rocket.reactnative.notification;

import android.util.Log;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.Callback;

import com.ammarahmed.mmkv.SecureKeystore;
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
     * Tries multiple sources for ReactApplicationContext:
     * 1. Already stored context
     * 2. Running React context from AppLifecycleFacade
     * 3. Static context from CustomPushNotification
     * 
     * NOTE: MMKV requires ReactApplicationContext (not regular Context) because SecureKeystore
     * needs access to React-specific resources. This means MMKV cannot be initialized before
     * React Native starts.
     */
    private void ensureMMKVInitialized() {
        Log.d("Ejson", "ensureMMKVInitialized() called");
        
        if (initializationAttempted) {
            Log.d("Ejson", "Already attempted initialization, mmkv=" + (mmkv != null ? "available" : "null"));
            return;  // Already tried (successfully or not)
        }
        
        initializationAttempted = true;
        Log.d("Ejson", "Starting MMKV initialization...");
        
        // Try to get context if we don't have one yet
        if (this.reactContext == null) {
            Log.d("Ejson", "No stored context, trying to find one...");
            
            // First, try to get running React context
            AppLifecycleFacade facade = AppLifecycleFacadeHolder.get();
            Log.d("Ejson", "AppLifecycleFacade: " + (facade != null ? "available" : "null"));
            
            if (facade != null) {
                Object runningContext = facade.getRunningReactContext();
                Log.d("Ejson", "Running context from facade: " + (runningContext != null ? runningContext.getClass().getSimpleName() : "null"));
                
                if (runningContext instanceof ReactApplicationContext) {
                    this.reactContext = (ReactApplicationContext) runningContext;
                    Log.d("Ejson", "✓ Got context from AppLifecycleFacade");
                }
            }
            
            // If still null, try CustomPushNotification's static context
            if (this.reactContext == null) {
                Log.d("Ejson", "Trying CustomPushNotification.reactApplicationContext: " + 
                    (CustomPushNotification.reactApplicationContext != null ? "available" : "null"));
                this.reactContext = CustomPushNotification.reactApplicationContext;
                
                if (this.reactContext != null) {
                    Log.d("Ejson", "✓ Got context from CustomPushNotification static field");
                }
            }
        } else {
            Log.d("Ejson", "Using already stored reactContext");
        }
        
        // Initialize MMKV if we have a context
        if (this.reactContext != null && mmkv == null) {
            Log.d("Ejson", "ReactApplicationContext available, initializing MMKV...");
            try {
                // Start MMKV container
                MMKV.initialize(this.reactContext);
                Log.d("Ejson", "MMKV.initialize() completed");
                
                SecureKeystore secureKeystore = new SecureKeystore(this.reactContext);
                Log.d("Ejson", "SecureKeystore created");

                // https://github.com/ammarahm-ed/react-native-mmkv-storage/blob/master/src/loader.js#L31
                String alias = Utils.toHex("com.MMKV.default");
                Log.d("Ejson", "Keystore alias: " + alias);

                // Retrieve container password
                String password = secureKeystore.getSecureKey(alias);
                Log.d("Ejson", "Password retrieved: " + (password != null ? "yes" : "null"));
                
                mmkv = MMKV.mmkvWithID("default", MMKV.SINGLE_PROCESS_MODE, password);
                
                Log.d("Ejson", "✅ MMKV initialized successfully, instance=" + (mmkv != null ? "valid" : "null"));
            } catch (Exception e) {
                Log.e("Ejson", "❌ Failed to initialize MMKV: " + e.getMessage(), e);
                mmkv = null;
            }
        } else if (this.reactContext == null) {
            Log.w("Ejson", "❌ Cannot initialize MMKV: no ReactApplicationContext available (React Native not started yet)");
        } else if (mmkv != null) {
            Log.d("Ejson", "MMKV already initialized");
        }
    }

    public String getAvatarUri() {
        if (type == null) {
            return null;
        }
        return serverURL() + "/avatar/" + this.sender.username + "?rc_token=" + token() + "&rc_uid=" + userId();
    }

    public String token() {
        Log.d("Ejson", "token() called");
        ensureMMKVInitialized();
        String userId = userId();
        if (mmkv != null && userId != null) {
            String token = mmkv.decodeString(TOKEN_KEY.concat(userId));
            Log.d("Ejson", "token() returning: " + (token != null ? "valid" : "null"));
            return token;
        }
        Log.w("Ejson", "token() failed: mmkv=" + (mmkv != null ? "valid" : "null") + ", userId=" + (userId != null ? "valid" : "null"));
        return "";
    }

    public String userId() {
        Log.d("Ejson", "userId() called");
        ensureMMKVInitialized();
        String serverURL = serverURL();
        if (mmkv != null && serverURL != null) {
            String userId = mmkv.decodeString(TOKEN_KEY.concat(serverURL));
            Log.d("Ejson", "userId() returning: " + (userId != null ? "valid" : "null"));
            return userId;
        }
        Log.w("Ejson", "userId() failed: mmkv=" + (mmkv != null ? "valid" : "null") + ", serverURL=" + (serverURL != null ? serverURL : "null"));
        return "";
    }

    public String privateKey() {
        Log.d("Ejson", "privateKey() called");
        ensureMMKVInitialized();
        String serverURL = serverURL();
        if (mmkv != null && serverURL != null) {
            String key = mmkv.decodeString(serverURL.concat("-RC_E2E_PRIVATE_KEY"));
            Log.d("Ejson", "privateKey() returning: " + (key != null ? "valid" : "null"));
            return key;
        }
        Log.w("Ejson", "privateKey() failed: mmkv=" + (mmkv != null ? "valid" : "null") + ", serverURL=" + (serverURL != null ? serverURL : "null"));
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
