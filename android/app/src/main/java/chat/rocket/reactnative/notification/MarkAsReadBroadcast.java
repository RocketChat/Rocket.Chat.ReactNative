package chat.rocket.reactnative.notification;

import android.app.NotificationManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.util.Log;

import com.google.gson.Gson;
import com.wix.reactnativenotifications.core.NotificationIntentAdapter;

import java.io.IOException;

import okhttp3.Call;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

public class MarkAsReadBroadcast extends BroadcastReceiver {
    private static final String TAG = "RocketChat.MarkAsRead";
    public static final String KEY_MARK_AS_READ = "KEY_MARK_AS_READ";
    private static final OkHttpClient client = new OkHttpClient();
    private static final MediaType JSON = MediaType.parse("application/json; charset=utf-8");

    @Override
    public void onReceive(Context context, Intent intent) {
        Bundle bundle = NotificationIntentAdapter.extractPendingNotificationDataFromIntent(intent);
        NotificationManager notificationManager = (NotificationManager) context
                .getSystemService(Context.NOTIFICATION_SERVICE);

        String notId = bundle.getString("notId");

        Gson gson = new Gson();
        Ejson ejson = gson.fromJson(bundle.getString("ejson", "{}"), Ejson.class);

        try {
            int id = Integer.parseInt(notId);
            markAsRead(ejson, id, notificationManager);
        } catch (NumberFormatException e) {
            Log.e(TAG, "Invalid notification ID: " + notId, e);
        }
    }

    protected void markAsRead(final Ejson ejson, final int notId, final NotificationManager notificationManager) {
        String serverURL = ejson.serverURL();
        String rid = ejson.rid;

        if (serverURL == null || rid == null) {
            Log.e(TAG, "Missing serverURL or rid");
            return;
        }

        String json = String.format("{\"rid\":\"%s\"}", rid);

        RequestBody body = RequestBody.create(JSON, json);
        Request request = new Request.Builder()
                .header("x-auth-token", ejson.token())
                .header("x-user-id", ejson.userId())
                .url(String.format("%s/api/v1/subscriptions.read", serverURL))
                .post(body)
                .build();

        client.newCall(request).enqueue(new okhttp3.Callback() {
            @Override
            public void onFailure(Call call, IOException e) {
                Log.e(TAG, "Mark as read FAILED: " + e.getMessage());
            }

            @Override
            public void onResponse(Call call, final Response response) throws IOException {
                try {
                    if (response.isSuccessful()) {
                        Log.d(TAG, "Mark as read SUCCESS");
                        CustomPushNotification.clearMessages(notId);
                        notificationManager.cancel(notId);
                    } else {
                        Log.e(TAG, String.format("Mark as read FAILED status %s", response.code()));
                    }
                } finally {
                    if (response.body() != null) {
                        response.body().close();
                    }
                }
            }
        });
    }
}
