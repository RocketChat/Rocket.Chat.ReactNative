package chat.rocket.reactnative;

import android.content.SharedPreferences;

import chat.rocket.userdefaults.RNUserDefaultsModule;

public class Ejson {
    String host;
    String rid;
    String type;
    Sender sender;

    public String getAvatarUri() {
        if (!type.equals("d")) {
            return null;
        }
        return serverURL() + "/avatar/" + this.sender.username + "?rc_token=" + token() + "&rc_uid=" + userId();
    }

    public String token() {
        SharedPreferences sharedPreferences = RNUserDefaultsModule.getPreferences();
        String BaseKEY = "reactnativemeteor_usertoken-";
        return sharedPreferences.getString(BaseKEY.concat(userId()), "");
    }

    public String userId() {
        SharedPreferences sharedPreferences = RNUserDefaultsModule.getPreferences();
        String BaseKEY = "reactnativemeteor_usertoken-";
        return sharedPreferences.getString(BaseKEY.concat(serverURL()), "");
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