package chat.rocket.reactnative;

import android.util.Log;
import android.content.SharedPreferences;

import chat.rocket.userdefaults.RNUserDefaultsModule;

public class Ejson {
    String host;
    String rid;
    Sender sender;

    public String getAvatarUri() {
        SharedPreferences sharedPreferences = RNUserDefaultsModule.getPreferences();

        String BaseKEY = "reactnativemeteor_usertoken-";
        String serverURL = this.serverURL();

        String userId = sharedPreferences.getString(BaseKEY.concat(serverURL), "");
        String token = sharedPreferences.getString(BaseKEY.concat(userId), "");

        return serverURL + "/avatar/" + this.sender.username + "?rc_token=" + token + "&rc_uid=" + userId;
    }

    public String serverURL() {
        String url = this.removeTrailingSlash(this.host);
        if (!url.contains("http")) {
           return "https://" + url;
        }
        return url;
    }

    public String getGroupIdentifier() {
        return this.host + this.rid;
    }

    private String removeTrailingSlash(String baseUrl) {
        String url = baseUrl;
        if (url.endsWith("/")) {
            url = url.substring(0, url.length() - 1);
        }
        return url;
    }

    private class Sender {
        String username;
    }
}