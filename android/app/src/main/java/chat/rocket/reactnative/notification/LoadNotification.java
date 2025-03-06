package chat.rocket.reactnative;

import android.os.Bundle;

import com.facebook.react.bridge.ReactApplicationContext;
import com.google.gson.Gson;

import okhttp3.HttpUrl;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;

class JsonResponse {
    Data data;

    class Data {
        Notification notification;

        class Notification {
            String notId;
            String title;
            String text;
            Payload payload;

            class Payload {
                String host;
                String rid;
                String type;
                Sender sender;
                String messageId;
                String notificationType;
                String name;
                String messageType;

                class Sender {
                    String _id;
                    String username;
                    String name;
                }
            }
        }
    }
}

public class LoadNotification {
    private int RETRY_COUNT = 0;
    private int[] TIMEOUT = new int[]{0, 1, 3, 5, 10};
    private String TOKEN_KEY = "reactnativemeteor_usertoken-";

    public void load(ReactApplicationContext reactApplicationContext, final Ejson ejson, Callback callback) {
        final OkHttpClient client = new OkHttpClient();
        HttpUrl.Builder url = HttpUrl.parse(ejson.serverURL().concat("/api/v1/push.get")).newBuilder();

        final String userId = ejson.userId();
        final String userToken = ejson.token();

        if (userId == null || userToken == null) {
            return;
        }

        Request request = new Request.Builder()
                .header("x-user-id", userId)
                .header("x-auth-token", userToken)
                .url(url.addQueryParameter("id", ejson.messageId).build())
                .build();

        runRequest(client, request, callback);
    }

    private void runRequest(OkHttpClient client, Request request, Callback callback) {
        try {
            Thread.sleep(TIMEOUT[RETRY_COUNT] * 1000);

            Response response = client.newCall(request).execute();
            String body = response.body().string();
            if (!response.isSuccessful()) {
                throw new Exception("Error");
            }

            Gson gson = new Gson();
            JsonResponse json = gson.fromJson(body, JsonResponse.class);

            Bundle bundle = new Bundle();
            bundle.putString("notId", json.data.notification.notId);
            bundle.putString("title", json.data.notification.title);
            bundle.putString("message", json.data.notification.text);
            bundle.putString("ejson", gson.toJson(json.data.notification.payload));
            bundle.putBoolean("notificationLoaded", true);

            callback.call(bundle);

        } catch (Exception e) {
            if (RETRY_COUNT <= TIMEOUT.length) {
                RETRY_COUNT++;
                runRequest(client, request, callback);
            } else {
                callback.call(null);
            }
        }
    }
}
