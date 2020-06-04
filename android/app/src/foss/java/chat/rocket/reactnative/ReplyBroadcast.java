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

import chat.rocket.userdefaults.RNUserDefaultsModule;
import com.wix.reactnativenotifications.core.NotificationIntentAdapter;

public class ReplyBroadcast extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {

    }
}
