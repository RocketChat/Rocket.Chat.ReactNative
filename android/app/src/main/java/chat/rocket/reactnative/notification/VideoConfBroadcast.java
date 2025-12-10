package chat.rocket.reactnative.notification;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.util.Log;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import java.util.HashMap;
import java.util.Map;

import chat.rocket.reactnative.MainActivity;

/**
 * Handles video conference notification actions (accept/decline).
 * Stores the action for the JS layer to process when the app opens.
 */
public class VideoConfBroadcast extends BroadcastReceiver {
    private static final String TAG = "RocketChat.VideoConf";
    
    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        Bundle extras = intent.getExtras();
        
        if (action == null || extras == null) {
            Log.w(TAG, "Received broadcast with null action or extras");
            return;
        }
        
        Log.d(TAG, "Received video conf action: " + action);
        
        String event = null;
        if (VideoConfNotification.ACTION_ACCEPT.equals(action)) {
            event = "accept";
        } else if (VideoConfNotification.ACTION_DECLINE.equals(action)) {
            event = "decline";
        }
        
        if (event == null) {
            Log.w(TAG, "Unknown action: " + action);
            return;
        }
        
        // Cancel the notification
        int notificationId = extras.getInt("notificationId", 0);
        if (notificationId != 0) {
            VideoConfNotification.cancelById(context, notificationId);
        }
        
        // Build data for JS layer
        Map<String, Object> data = new HashMap<>();
        data.put("notificationType", extras.getString("notificationType", "videoconf"));
        data.put("rid", extras.getString("rid", ""));
        data.put("event", event);
        
        // Add caller info
        Map<String, String> caller = new HashMap<>();
        caller.put("_id", extras.getString("callerId", ""));
        caller.put("name", extras.getString("callerName", ""));
        data.put("caller", caller);
        
        // Store action for the JS layer to pick up
        Gson gson = new GsonBuilder().create();
        String jsonData = gson.toJson(data);
        
        VideoConfModule.storePendingAction(context, jsonData);
        
        Log.d(TAG, "Stored video conf action: " + event + " for rid: " + extras.getString("rid"));
        
        // Launch the app
        Intent launchIntent = new Intent(context, MainActivity.class);
        launchIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        launchIntent.putExtras(extras);
        launchIntent.putExtra("event", event);
        context.startActivity(launchIntent);
    }
}
