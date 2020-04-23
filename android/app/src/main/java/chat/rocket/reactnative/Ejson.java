package chat.rocket.reactnative;

import android.content.SharedPreferences;

import chat.rocket.userdefaults.RNUserDefaultsModule;

public class Ejson {
    String host;
    String rid;
    String type;
    Sender sender;

    private String TOKEN_KEY = "reactnativemeteor_usertoken-";
    private SharedPreferences sharedPreferences = RNUserDefaultsModule.getPreferences(CustomPushNotification.reactApplicationContext);

    public String getAvatarUri() {
        if (type == null) {
            return null;
        }
        return serverURL() + "/avatar/" + this.sender.username + "?rc_token=" + token() + "&rc_uid=" + userId();
    }

    public String token() {
        return sharedPreferences.getString(TOKEN_KEY.concat(userId()), "");
    }

    public String userId() {
        return sharedPreferences.getString(TOKEN_KEY.concat(serverURL()), "");
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