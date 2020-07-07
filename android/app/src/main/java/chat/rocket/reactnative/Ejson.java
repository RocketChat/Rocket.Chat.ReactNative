package chat.rocket.reactnative;

public class Ejson {
    String host;
    String rid;
    String type;
    Sender sender;

    private String TOKEN_KEY = "reactnativemeteor_usertoken-";

    public String getAvatarUri() {
        if (type == null) {
            return null;
        }
        return serverURL() + "/avatar/" + this.sender.username;
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