package chat.rocket.reactnative;

import android.os.Bundle;
import android.content.Context;
import android.content.SharedPreferences;

import okhttp3.Call;
import okhttp3.OkHttpClient;
import okhttp3.HttpUrl;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.Interceptor;

import com.google.gson.Gson;
import java.io.IOException;

import com.facebook.react.bridge.ReactApplicationContext;

import chat.rocket.userdefaults.RNUserDefaultsModule;

class JsonResponse {
  String title;
  String message;
  String ejson;
}

public class LoadNotification {
  private static int RETRY_COUNT = 0;
  private static int[] TIMEOUT = new int[]{ 0, 1, 3, 5, 10 };
  private static String TOKEN_KEY = "reactnativemeteor_usertoken-";
  private static SharedPreferences sharedPreferences = RNUserDefaultsModule.getPreferences(CustomPushNotification.reactApplicationContext);

  public static void load(ReactApplicationContext reactApplicationContext, final String host, final String msgId, Callback callback) {
    final OkHttpClient client = new OkHttpClient();
    HttpUrl.Builder url = HttpUrl.parse(host.concat("/notification")).newBuilder();

    String userId = sharedPreferences.getString(TOKEN_KEY.concat(host), "");
    String token = sharedPreferences.getString(TOKEN_KEY.concat(userId), "");

    Request request = new Request.Builder()
      .header("x-user-id", userId)
      .header("x-auth-token", token)
      .url(url.addQueryParameter("msgId", msgId).build())
      .build();

    runRequest(client, request, callback);
  }

  private static void runRequest(OkHttpClient client, Request request, Callback callback) {
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
      bundle.putString("title", json.message.u.username);
      bundle.putString("message", json.message.msg);

      callback.call(bundle);

    } catch (Exception e) {
      if (RETRY_COUNT <= TIMEOUT.length) {
        runRequest(client, request, callback);
      }
    }

    RETRY_COUNT++;
  }
}