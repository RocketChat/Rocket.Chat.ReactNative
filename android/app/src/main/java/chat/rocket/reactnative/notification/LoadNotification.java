package chat.rocket.reactnative.notification;

import android.os.Bundle;
import android.util.Log;

import com.facebook.react.bridge.ReactApplicationContext;
import com.google.gson.Gson;
import com.google.gson.JsonSyntaxException;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

import okhttp3.HttpUrl;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.ResponseBody;

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
                String senderName;
                String msg;
                String tmid;
                Content content;

                class Sender {
                    String _id;
                    String username;
                    String name;
                }
                
                class Content {
                    String algorithm;
                    String ciphertext;
                    String kid;
                    String iv;
                }
            }
        }
    }
}

public class LoadNotification {
    private static final String TAG = "RocketChat.LoadNotif";
    private int RETRY_COUNT = 0;
    private int[] TIMEOUT = new int[]{0, 1, 3, 5, 10};
    private String TOKEN_KEY = "reactnativemeteor_usertoken-";

    public void load(ReactApplicationContext reactApplicationContext, final Ejson ejson, Callback callback) {
        Log.i(TAG, "Starting notification load for message-id-only notification");
        
        // Validate ejson object
        if (ejson == null) {
            Log.e(TAG, "Failed to load notification: ejson is null");
            callback.call(null);
            return;
        }
        
        final String serverURL = ejson.serverURL();
        final String messageId = ejson.messageId;
        
        Log.d(TAG, "Notification payload - serverURL: " + NotificationHelper.sanitizeUrl(serverURL) + ", messageId: " + (messageId != null ? "[present]" : "[null]"));
        
        // Validate required fields
        if (serverURL == null || serverURL.isEmpty()) {
            Log.e(TAG, "Failed to load notification: serverURL is null or empty");
            callback.call(null);
            return;
        }
        
        if (messageId == null || messageId.isEmpty()) {
            Log.e(TAG, "Failed to load notification: messageId is null or empty");
            callback.call(null);
            return;
        }

        final String userId = ejson.userId();
        final String userToken = ejson.token();

        if (userId == null || userId.isEmpty()) {
            Log.w(TAG, "Failed to load notification: userId is null or empty (user may not be logged in)");
            callback.call(null);
            return;
        }
        
        if (userToken == null || userToken.isEmpty()) {
            Log.w(TAG, "Failed to load notification: userToken is null or empty (user may not be logged in)");
            callback.call(null);
            return;
        }

        // Configure OkHttpClient with proper timeouts
        final OkHttpClient client = new OkHttpClient.Builder()
                .connectTimeout(10, TimeUnit.SECONDS)
                .readTimeout(30, TimeUnit.SECONDS)
                .writeTimeout(30, TimeUnit.SECONDS)
                .build();

        HttpUrl.Builder urlBuilder;
        try {
            urlBuilder = HttpUrl.parse(serverURL.concat("/api/v1/push.get")).newBuilder();
        } catch (Exception e) {
            Log.e(TAG, "Failed to parse server URL: " + NotificationHelper.sanitizeUrl(serverURL), e);
            callback.call(null);
            return;
        }

        Request request = new Request.Builder()
                .header("x-user-id", userId)
                .header("x-auth-token", userToken)
                .url(urlBuilder.addQueryParameter("id", messageId).build())
                .build();
        
        String sanitizedEndpoint = NotificationHelper.sanitizeUrl(serverURL) + "/api/v1/push.get";
        Log.d(TAG, "Built request to endpoint: " + sanitizedEndpoint);

        runRequest(client, request, callback, sanitizedEndpoint);
    }

    private void runRequest(OkHttpClient client, Request request, Callback callback, String sanitizedEndpoint) {
        try {
            int delay = TIMEOUT[RETRY_COUNT];
            if (delay > 0) {
                Log.d(TAG, "Retry attempt " + RETRY_COUNT + ", waiting " + delay + " seconds before request");
            } else {
                Log.d(TAG, "Attempt " + (RETRY_COUNT + 1) + ", executing request to " + sanitizedEndpoint);
            }
            
            Thread.sleep(delay * 1000);

            Response response = client.newCall(request).execute();
            int statusCode = response.code();
            
            ResponseBody responseBody = response.body();
            if (responseBody == null) {
                Log.e(TAG, "Request failed: response body is null (status: " + statusCode + ")");
                throw new IOException("Response body is null");
            }
            
            String body = responseBody.string();
            
            if (!response.isSuccessful()) {
                if (statusCode == 401 || statusCode == 403) {
                    Log.w(TAG, "Authentication failed: HTTP " + statusCode + " - user may need to re-login");
                } else if (statusCode >= 500) {
                    Log.e(TAG, "Server error: HTTP " + statusCode + " - server may be experiencing issues");
                } else {
                    Log.w(TAG, "Request failed with HTTP " + statusCode);
                }
                throw new IOException("HTTP " + statusCode);
            }
            
            Log.i(TAG, "Successfully received response (HTTP " + statusCode + "), parsing notification data");

            Gson gson = new Gson();
            JsonResponse json;
            try {
                json = gson.fromJson(body, JsonResponse.class);
            } catch (JsonSyntaxException e) {
                Log.e(TAG, "Failed to parse JSON response", e);
                throw e;
            }
            
            // Validate parsed response structure
            if (json == null || json.data == null || json.data.notification == null) {
                Log.e(TAG, "Invalid response structure: missing required fields");
                throw new IllegalStateException("Invalid response structure");
            }
            
            // Log encryption fields if present
            if (json.data.notification.payload != null) {
                boolean hasEncryption = json.data.notification.payload.msg != null || json.data.notification.payload.content != null;
                if (hasEncryption) {
                    Log.d(TAG, "Notification contains encrypted content: msg=" + (json.data.notification.payload.msg != null) + 
                               ", content=" + (json.data.notification.payload.content != null));
                }
            }

            Bundle bundle = new Bundle();
            bundle.putString("notId", json.data.notification.notId);
            bundle.putString("title", json.data.notification.title);
            bundle.putString("message", json.data.notification.text);
            bundle.putString("ejson", gson.toJson(json.data.notification.payload));
            bundle.putBoolean("notificationLoaded", true);

            Log.i(TAG, "Successfully loaded and parsed notification data");
            callback.call(bundle);

        } catch (IOException e) {
            Log.e(TAG, "Network error on attempt " + (RETRY_COUNT + 1) + ": " + e.getClass().getSimpleName() + " - " + e.getMessage());
            handleRetryOrFailure(client, request, callback, sanitizedEndpoint);
        } catch (JsonSyntaxException e) {
            Log.e(TAG, "JSON parsing error: " + e.getMessage());
            handleRetryOrFailure(client, request, callback, sanitizedEndpoint);
        } catch (InterruptedException e) {
            Log.e(TAG, "Request interrupted: " + e.getMessage());
            Thread.currentThread().interrupt(); // Restore interrupt status
            callback.call(null);
        } catch (Exception e) {
            Log.e(TAG, "Unexpected error on attempt " + (RETRY_COUNT + 1) + ": " + e.getClass().getSimpleName() + " - " + e.getMessage());
            handleRetryOrFailure(client, request, callback, sanitizedEndpoint);
        }
    }
    
    private void handleRetryOrFailure(OkHttpClient client, Request request, Callback callback, String sanitizedEndpoint) {
        if (RETRY_COUNT < TIMEOUT.length - 1) {
            RETRY_COUNT++;
            Log.d(TAG, "Will retry request (attempt " + (RETRY_COUNT + 1) + " of " + TIMEOUT.length + ")");
            runRequest(client, request, callback, sanitizedEndpoint);
        } else {
            Log.e(TAG, "All retry attempts exhausted (" + TIMEOUT.length + " attempts). Notification load failed.");
            callback.call(null);
        }
    }
}
