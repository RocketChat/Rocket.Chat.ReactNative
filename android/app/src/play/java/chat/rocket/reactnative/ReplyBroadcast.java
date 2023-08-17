package chat.rocket.reactnative;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.RemoteInput;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.res.Resources;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;

import java.io.IOException;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import java.util.HashMap;
import java.util.Map;

import okhttp3.Call;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

import com.wix.reactnativenotifications.core.NotificationIntentAdapter;

public class ReplyBroadcast extends BroadcastReceiver {
    private Context mContext;
    private Bundle bundle;
    private NotificationManager notificationManager;

    @Override
    public void onReceive(Context context, Intent intent) {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.N) {
            final CharSequence message = getReplyMessage(intent);
            if (message == null) {
                return;
            }

            mContext = context;
            bundle = NotificationIntentAdapter.extractPendingNotificationDataFromIntent(intent);
            notificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);

            String notId = bundle.getString("notId");

            Gson gson = new Gson();
            Ejson ejson = gson.fromJson(bundle.getString("ejson", "{}"), Ejson.class);

            replyToMessage(ejson, Integer.parseInt(notId), message);
        }
    }

    protected void replyToMessage(final Ejson ejson, final int notId, final CharSequence message) {
        String serverURL = ejson.serverURL();
        String rid = ejson.rid;

        if (serverURL == null || rid == null) {
            return;
        }

        final OkHttpClient client = new OkHttpClient();
        final MediaType JSON = MediaType.parse("application/json; charset=utf-8");

        String json = buildMessage(rid, message.toString(), ejson);

        CustomPushNotification.clearMessages(notId);

        RequestBody body = RequestBody.create(JSON, json);
        Request request = new Request.Builder()
                .header("x-auth-token", ejson.token())
                .header("x-user-id", ejson.userId())
                .url(String.format("%s/api/v1/chat.sendMessage", serverURL))
                .post(body)
                .build();

        client.newCall(request).enqueue(new okhttp3.Callback() {
            @Override
            public void onFailure(Call call, IOException e) {
                Log.i("RCNotification", String.format("Reply FAILED exception %s", e.getMessage()));
                onReplyFailed(notificationManager, notId);
            }

            @Override
            public void onResponse(Call call, final Response response) throws IOException {
                if (response.isSuccessful()) {
                    Log.d("RCNotification", "Reply SUCCESS");
                    onReplySuccess(notificationManager, notId);
                } else {
                    Log.i("RCNotification", String.format("Reply FAILED status %s BODY %s", response.code(), response.body().string()));
                    onReplyFailed(notificationManager, notId);
                }
            }
        });
    }

    private String getMessageId() {
        final String ALPHA_NUMERIC_STRING = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        int count = 17;
        StringBuilder builder = new StringBuilder();
        while (count-- != 0) {
            int character = (int) (Math.random() * ALPHA_NUMERIC_STRING.length());
            builder.append(ALPHA_NUMERIC_STRING.charAt(character));
        }
        return builder.toString();
    }

    protected String buildMessage(String rid, String message, Ejson ejson) {
        Gson gsonBuilder = new GsonBuilder().create();

        String id = getMessageId();

        String msg = Encryption.shared.encryptMessage(message, id, ejson);

        Map msgMap = new HashMap();
        msgMap.put("_id", id);
        msgMap.put("rid", rid);
        msgMap.put("msg", msg);
        if (msg != message) {
            msgMap.put("t", "e2e");
        }
        if(ejson.tmid != null) {
            msgMap.put("tmid", ejson.tmid);
        }

        Map m = new HashMap();
        m.put("message", msgMap);

        String json = gsonBuilder.toJson(m);

        return json;
    }

    protected void onReplyFailed(NotificationManager notificationManager, int notId) {
        String CHANNEL_ID = "CHANNEL_ID_REPLY_FAILED";

        final Resources res = mContext.getResources();
        String packageName = mContext.getPackageName();
        int smallIconResId = res.getIdentifier("ic_notification", "drawable", packageName);

        NotificationChannel channel = new NotificationChannel(CHANNEL_ID, CHANNEL_ID, NotificationManager.IMPORTANCE_LOW);
        notificationManager.createNotificationChannel(channel);
        Notification notification =
                new Notification.Builder(mContext, CHANNEL_ID)
                        .setContentTitle("Failed to reply message.")
                        .setSmallIcon(smallIconResId)
                        .build();

        notificationManager.notify(notId, notification);
    }

    protected void onReplySuccess(NotificationManager notificationManager, int notId) {
        notificationManager.cancel(notId);
    }

    private CharSequence getReplyMessage(Intent intent) {
        Bundle remoteInput = RemoteInput.getResultsFromIntent(intent);
        if (remoteInput != null) {
            return remoteInput.getCharSequence(CustomPushNotification.KEY_REPLY);
        }
        return null;
    }
}
