package chat.rocket.reactnative;

public class Ejson {
    String host;
    String rid;
    Sender sender;

    public String getAvatarUri() {
        return this.removeTrailingSlash(this.host) + "/avatar/" + this.sender.username;
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