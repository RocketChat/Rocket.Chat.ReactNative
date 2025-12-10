package chat.rocket.reactnative.notification;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.res.Resources;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;

import androidx.core.app.NotificationCompat;

import chat.rocket.reactnative.MainActivity;

/**
 * Handles video conference call notifications with call-style UI.
 * Displays incoming call notifications with Accept/Decline actions.
 */
public class VideoConfNotification {
    private static final String TAG = "RocketChat.VideoConf";
    
    public static final String CHANNEL_ID = "video-conf-call";
    public static final String CHANNEL_NAME = "Video Calls";
    
    public static final String ACTION_ACCEPT = "chat.rocket.reactnative.ACTION_VIDEO_CONF_ACCEPT";
    public static final String ACTION_DECLINE = "chat.rocket.reactnative.ACTION_VIDEO_CONF_DECLINE";
    public static final String EXTRA_NOTIFICATION_DATA = "notification_data";
    
    private final Context context;
    private final NotificationManager notificationManager;
    
    public VideoConfNotification(Context context) {
        this.context = context;
        this.notificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        createNotificationChannel();
    }
    
    /**
     * Creates the notification channel for video calls with high importance and ringtone sound.
     */
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            );
            
            channel.setDescription("Incoming video conference calls");
            channel.enableLights(true);
            channel.enableVibration(true);
            channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            
            // Set ringtone sound
            Uri ringtoneUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                .build();
            channel.setSound(ringtoneUri, audioAttributes);
            
            if (notificationManager != null) {
                notificationManager.createNotificationChannel(channel);
            }
        }
    }
    
    /**
     * Displays an incoming video call notification.
     * 
     * @param bundle The notification data bundle
     * @param ejson The parsed notification payload
     */
    public void showIncomingCall(Bundle bundle, Ejson ejson) {
        String rid = ejson.rid;
        // Video conf uses 'caller' field, regular messages use 'sender'
        String callerId = "";
        String callerName = "Unknown";
        
        if (ejson.caller != null) {
            callerId = ejson.caller._id != null ? ejson.caller._id : "";
            callerName = ejson.caller.name != null ? ejson.caller.name : "Unknown";
        } else if (ejson.sender != null) {
            // Fallback to sender if caller is not present
            callerId = ejson.sender._id != null ? ejson.sender._id : "";
            callerName = ejson.sender.name != null ? ejson.sender.name : (ejson.senderName != null ? ejson.senderName : "Unknown");
        }
        
        // Generate unique notification ID from rid + callerId
        String notificationIdStr = (rid + callerId).replaceAll("[^A-Za-z0-9]", "");
        int notificationId = notificationIdStr.hashCode();
        
        Log.d(TAG, "Showing incoming call notification from: " + callerName);
        
        // Create intent data for actions - include all required fields for JS
        Bundle intentData = new Bundle();
        intentData.putString("rid", rid != null ? rid : "");
        intentData.putString("notificationType", "videoconf");
        intentData.putString("callerId", callerId);
        intentData.putString("callerName", callerName);
        intentData.putString("host", ejson.host != null ? ejson.host : "");
        intentData.putString("callId", ejson.callId != null ? ejson.callId : "");
        intentData.putString("ejson", bundle.getString("ejson", "{}"));
        intentData.putInt("notificationId", notificationId);
        
        Log.d(TAG, "Intent data - rid: " + rid + ", callerId: " + callerId + ", host: " + ejson.host + ", callId: " + ejson.callId);
        
        // Full screen intent - opens app when notification is tapped
        Intent fullScreenIntent = new Intent(context, MainActivity.class);
        fullScreenIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        fullScreenIntent.putExtras(intentData);
        fullScreenIntent.putExtra("event", "default");
        
        PendingIntent fullScreenPendingIntent;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            fullScreenPendingIntent = PendingIntent.getActivity(
                context, notificationId, fullScreenIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
        } else {
            fullScreenPendingIntent = PendingIntent.getActivity(
                context, notificationId, fullScreenIntent,
                PendingIntent.FLAG_UPDATE_CURRENT
            );
        }
        
        // Accept action - directly opens MainActivity (Android 12+ blocks trampoline pattern)
        Intent acceptIntent = new Intent(context, MainActivity.class);
        acceptIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        acceptIntent.putExtras(intentData);
        acceptIntent.putExtra("event", "accept");
        acceptIntent.putExtra("videoConfAction", true);
        acceptIntent.setAction(ACTION_ACCEPT + "_" + notificationId); // Unique action to differentiate intents
        
        PendingIntent acceptPendingIntent;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            acceptPendingIntent = PendingIntent.getActivity(
                context, notificationId + 1, acceptIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
        } else {
            acceptPendingIntent = PendingIntent.getActivity(
                context, notificationId + 1, acceptIntent,
                PendingIntent.FLAG_UPDATE_CURRENT
            );
        }
        
        // Decline action - directly opens MainActivity
        Intent declineIntent = new Intent(context, MainActivity.class);
        declineIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        declineIntent.putExtras(intentData);
        declineIntent.putExtra("event", "decline");
        declineIntent.putExtra("videoConfAction", true);
        declineIntent.setAction(ACTION_DECLINE + "_" + notificationId); // Unique action to differentiate intents
        
        PendingIntent declinePendingIntent;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            declinePendingIntent = PendingIntent.getActivity(
                context, notificationId + 2, declineIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
        } else {
            declinePendingIntent = PendingIntent.getActivity(
                context, notificationId + 2, declineIntent,
                PendingIntent.FLAG_UPDATE_CURRENT
            );
        }
        
        // Get icons
        Resources res = context.getResources();
        String packageName = context.getPackageName();
        int smallIconResId = res.getIdentifier("ic_notification", "drawable", packageName);
        
        // Build notification
        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(smallIconResId)
            .setContentTitle("Incoming call")
            .setContentText("Video call from " + callerName)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setAutoCancel(false)
            .setOngoing(true)
            .setFullScreenIntent(fullScreenPendingIntent, true)
            .setContentIntent(fullScreenPendingIntent)
            .addAction(0, "Decline", declinePendingIntent)
            .addAction(0, "Accept", acceptPendingIntent);
        
        // Set sound for pre-O devices
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            Uri ringtoneUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
            builder.setSound(ringtoneUri);
        }
        
        // Show notification
        if (notificationManager != null) {
            notificationManager.notify(notificationId, builder.build());
            Log.d(TAG, "Video call notification displayed with ID: " + notificationId);
        }
    }
    
    /**
     * Cancels a video call notification.
     * 
     * @param rid The room ID
     * @param callerId The caller's user ID
     */
    public void cancelCall(String rid, String callerId) {
        String notificationIdStr = (rid + callerId).replaceAll("[^A-Za-z0-9]", "");
        int notificationId = notificationIdStr.hashCode();
        
        if (notificationManager != null) {
            notificationManager.cancel(notificationId);
            Log.d(TAG, "Video call notification cancelled with ID: " + notificationId);
        }
    }
    
    /**
     * Cancels a video call notification by notification ID.
     * 
     * @param notificationId The notification ID
     */
    public static void cancelById(Context context, int notificationId) {
        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null) {
            manager.cancel(notificationId);
            Log.d(TAG, "Video call notification cancelled with ID: " + notificationId);
        }
    }
}
