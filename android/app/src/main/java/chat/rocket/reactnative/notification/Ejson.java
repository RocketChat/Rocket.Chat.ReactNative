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
    String senderName;
    String msg;

    String tmid;

    Content content;

    private ReactApplicationContext reactContext;

    private MMKV mmkv;

    private String TOKEN_KEY = "reactnativemeteor_usertoken-";

    public Ejson() {
        AppLifecycleFacade facade = AppLifecycleFacadeHolder.get();
        if (facade != null && facade.getRunningReactContext() instanceof ReactApplicationContext) {
            this.reactContext = (ReactApplicationContext) facade.getRunningReactContext();
        }

        // Only initialize MMKV if we have a valid React context
        if (this.reactContext != null) {
            try {
                // Start MMKV container
                MMKV.initialize(this.reactContext);
                SecureKeystore secureKeystore = new SecureKeystore(this.reactContext);

                // https://github.com/ammarahm-ed/react-native-mmkv-storage/blob/master/src/loader.js#L31
                String alias = Utils.toHex("com.MMKV.default");

                // Retrieve container password
                String password = secureKeystore.getSecureKey(alias);
                mmkv = MMKV.mmkvWithID("default", MMKV.SINGLE_PROCESS_MODE, password);
            } catch (Exception e) {
                Log.e("Ejson", "Failed to initialize MMKV: " + e.getMessage());
                mmkv = null;
            }
        } else {
            Log.w("Ejson", "React context is null, MMKV will not be initialized");
            mmkv = null;
        }
    }

    public String getAvatarUri() {
        if (type == null) {
            return null;
        }
        return serverURL() + "/avatar/" + this.sender.username + "?rc_token=" + token() + "&rc_uid=" + userId();
    }

    public String token() {
        String userId = userId();
        if (mmkv != null && userId != null) {
            return mmkv.decodeString(TOKEN_KEY.concat(userId));
        }
        return "";
    }

    public String userId() {
        String serverURL = serverURL();
        if (mmkv != null && serverURL != null) {
            return mmkv.decodeString(TOKEN_KEY.concat(serverURL));
        }
        return "";
    }

    public String privateKey() {
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

    public class Sender {
        String username;
        String _id;
    }

    public class Content {
        String ciphertext;
        String algorithm;
    }
}
