package chat.rocket.reactnative;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.Callback;

import com.ammarahmed.mmkv.SecureKeystore;
import com.tencent.mmkv.MMKV;

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

class Credentials {
    String userId;
    String userToken;

    Credentials(String userId, String userToken) {
        this.userId = userId;
        this.userToken = userToken;
    }
}

final class Storage {
    private MMKV mmkv;

    private String TOKEN_KEY = "reactnativemeteor_usertoken-";

    Storage(ReactApplicationContext reactApplicationContext) {
        // Start MMKV container
        MMKV.initialize(reactApplicationContext);
        SecureKeystore secureKeystore = new SecureKeystore(reactApplicationContext);

        // https://github.com/ammarahm-ed/react-native-mmkv-storage/blob/master/src/loader.js#L31
        String alias = Utils.toHex("com.MMKV.default");

        // Retrieve container password
        secureKeystore.getSecureKey(alias, new RNCallback() {
            @Override
            public void invoke(Object... args) {
                String error = (String) args[0];
                if (error == null) {
                    String password = (String) args[1];
                    mmkv = MMKV.mmkvWithID("default", MMKV.SINGLE_PROCESS_MODE, password);
                }
            }
        });
    }

    Credentials getCredentials(String server) {
        if (mmkv != null) {
            String userId = mmkv.decodeString(TOKEN_KEY.concat(server));
            if (userId != null) {
                String userToken = mmkv.decodeString(TOKEN_KEY.concat(userId));
                return new Credentials(userId, userToken);
            }
        }

        return null;
    }

    String getPrivateKey(String server) {
        if (mmkv != null) {
            return mmkv.decodeString(server.concat("-RC_E2E_PRIVATE_KEY"));
        }

        return null;
    }
}
