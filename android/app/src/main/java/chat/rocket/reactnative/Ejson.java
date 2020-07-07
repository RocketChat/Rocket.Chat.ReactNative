package chat.rocket.reactnative;

import com.tencent.mmkv.MMKV;

public class Ejson {
    String host;
    String rid;
    String type;
    Sender sender;

    private final MMKV mmkv;

    private String TOKEN_KEY = "reactnativemeteor_usertoken-";

    public Ejson() {
        // Start MMKV container
        MMKV.initialize(CustomPushNotification.reactApplicationContext);
        mmkv = MMKV.mmkvWithID(CustomPushNotification.reactApplicationContext.getPackageName(), MMKV.SINGLE_PROCESS_MODE, "rocketchat");
    }

    public String getAvatarUri() {
        if (type == null) {
            return null;
        }
        return serverURL() + "/avatar/" + this.sender.username + "?rc_token=" + token() + "&rc_uid=" + userId();
    }

    public String token() {
        return mmkv.decodeString(TOKEN_KEY.concat(userId()), "");
    }

    public String userId() {
        return mmkv.decodeString(TOKEN_KEY.concat(serverURL()), "");
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
}