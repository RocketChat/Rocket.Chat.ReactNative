package chat.rocket.reactnative.notification;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Person;
import android.app.RemoteInput;
import android.content.Context;
import android.content.Intent;
import android.content.res.Resources;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.drawable.Icon;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.ReactApplicationContext;
import com.google.gson.Gson;

import java.util.ArrayList;
import java.util.Date;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

import chat.rocket.reactnative.BuildConfig;
import chat.rocket.reactnative.MainActivity;
import chat.rocket.reactnative.R;

/**
 * Custom push notification handler for Rocket.Chat.
 * 
 * Handles standard push notifications and End-to-End encrypted (E2E) notifications.
 * Provides MessagingStyle notifications, direct reply, and advanced processing.
 */
public class CustomPushNotification {
    private static final String TAG = "RocketChat.CustomPush";
    private static final boolean ENABLE_VERBOSE_LOGS = BuildConfig.DEBUG;
    
    // Shared state
    public static volatile ReactApplicationContext reactApplicationContext;
    private static final Gson gson = new Gson();
    private static final Map<String, List<Bundle>> notificationMessages = new ConcurrentHashMap<>();
    private static final List<PendingNotification> pendingNotifications = new CopyOnWriteArrayList<>();
    
    /**
     * Holds a notification that arrived before React Native was initialized.
     */
    private static class PendingNotification {
        final Context context;
        final Bundle bundle;
        
        PendingNotification(Context context, Bundle bundle) {
            this.context = context;
            this.bundle = bundle;
        }
    }
    
    // Constants
    public static final String KEY_REPLY = "KEY_REPLY";
    public static final String NOTIFICATION_ID = "NOTIFICATION_ID";
    private static final String CHANNEL_ID = "rocketchatrn_channel_01";
    private static final String CHANNEL_NAME = "All";
    
    // Instance fields
    private final Context mContext;
    private volatile Bundle mBundle;
    private final NotificationManager notificationManager;
    
    public CustomPushNotification(Context context, Bundle bundle) {
        this.mContext = context;
        this.mBundle = bundle;
        this.notificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        
        // Ensure notification channel exists
        createNotificationChannel();
    }

    /**
     * Sets the React application context when React Native initializes.
     * Called from MainApplication when React context is ready.
     * Processes any notifications that were queued before React was ready.
     */
    public static void setReactContext(ReactApplicationContext context) {
        reactApplicationContext = context;
        
        // Process any notifications that arrived before React was initialized
        if (!pendingNotifications.isEmpty()) {
            int count = pendingNotifications.size();
            Log.i(TAG, "React initialized, processing " + count + " queued notification(s)");
            
            for (PendingNotification pending : pendingNotifications) {
                try {
                    CustomPushNotification notification = new CustomPushNotification(pending.context, pending.bundle);
                    notification.handleNotification();
                } catch (Exception e) {
                    Log.e(TAG, "Failed to process queued notification", e);
                }
            }
            
            pendingNotifications.clear();
        }
    }

    public static void clearMessages(int notId) {
        notificationMessages.remove(Integer.toString(notId));
    }

    public void onReceived() {
        String notId = mBundle.getString("notId");
        
        if (notId == null || notId.isEmpty()) {
            Log.w(TAG, "Missing notification ID, ignoring notification");
            return;
        }
        
        try {
            Integer.parseInt(notId);
        } catch (NumberFormatException e) {
            Log.w(TAG, "Invalid notification ID format: " + notId);
            return;
        }
        
        // Process notification
        // E2E notifications can be processed immediately (no React needed after SQLiteDatabase refactor)
        // Other notifications (message-id-only, avatars) still need React for MMKV access
        try {
            handleNotification();
        } catch (Exception e) {
            Log.e(TAG, "Failed to process notification", e);
        }
    }
    
    private void handleNotification() {
        Ejson receivedEjson = safeFromJson(mBundle.getString("ejson", "{}"), Ejson.class);

        // Message-id-only notifications need React for MMKV access (tokens for API calls)
        if (receivedEjson != null && receivedEjson.notificationType != null && receivedEjson.notificationType.equals("message-id-only")) {
            if (reactApplicationContext == null) {
                Log.w(TAG, "React not initialized, queueing message-id-only notification for later...");
                pendingNotifications.add(new PendingNotification(mContext, mBundle));
                return;
            }
            loadNotificationAndProcess(receivedEjson);
            return; // Exit early, notification will be processed in callback
        }

        // For other notifications (including E2E), process immediately
        // E2E notifications can decrypt without React (using SQLiteDatabase directly)
        processNotification();
    }
    
    private void loadNotificationAndProcess(Ejson ejson) {
        notificationLoad(ejson, new Callback() {
            @Override
            public void call(@Nullable Bundle bundle) {
                if (bundle != null) {
                    synchronized(CustomPushNotification.this) {
                        mBundle = bundle;
                    }
                } else {
                    Log.e(TAG, "Failed to load notification content from server");
                }
                
                processNotification();
            }
        });
    }
    
    private void processNotification() {
        Ejson loadedEjson = safeFromJson(mBundle.getString("ejson", "{}"), Ejson.class);
        String notId = mBundle.getString("notId", "1");

        // Handle E2E encrypted notifications
        if (isE2ENotification(loadedEjson)) {
            handleE2ENotification(mBundle, loadedEjson, notId);
            return; // E2E processor will handle showing the notification
        }

        // Handle regular (non-E2E) notifications
        showNotification(mBundle, loadedEjson, notId);
    }

    /**
     * Checks if this is an E2E encrypted notification.
     */
    private boolean isE2ENotification(Ejson ejson) {
        return ejson != null && "e2e".equals(ejson.messageType);
    }

    /**
     * Handles E2E encrypted notifications.
     * Decrypts immediately using standard SQLiteDatabase (no React Native dependency needed).
     */
    private void handleE2ENotification(Bundle bundle, Ejson ejson, String notId) {
        // Decrypt immediately using static MainApplication.instance (no Context parameter needed)
        String decrypted = Encryption.shared.decryptMessage(ejson);
        
        if (decrypted != null) {
            bundle.putString("message", decrypted);
            mBundle = bundle;
            ejson = safeFromJson(bundle.getString("ejson", "{}"), Ejson.class);
            showNotification(bundle, ejson, notId);
        } else {
            Log.e(TAG, "E2E decryption failed, notification will not be shown");
        }
    }

    /**
     * Shows the notification to the user.
     * Centralizes the notification display logic.
     */
    private void showNotification(Bundle bundle, Ejson ejson, String notId) {
        // Initialize notification message list for this ID
        if (notificationMessages.get(notId) == null) {
            notificationMessages.put(notId, new ArrayList<>());
        }

        // Prepare notification data
        boolean hasSender = ejson != null && ejson.sender != null;
        String title = bundle.getString("title");

        bundle.putLong("time", new Date().getTime());
        bundle.putString("username", hasSender ? ejson.sender.username : title);
        bundle.putString("senderId", hasSender ? ejson.sender._id : "1");
        
        String avatarUri = ejson != null ? ejson.getAvatarUri() : null;
        bundle.putString("avatarUri", avatarUri);

        // Handle special notification types
        if (ejson != null && "videoconf".equals(ejson.notificationType)) {
            handleVideoConfNotification(bundle, ejson);
            return;
        } else {
            // Show regular notification
            notificationMessages.get(notId).add(bundle);
            postNotification(Integer.parseInt(notId));
        }
    }

    /**
     * Handles video conference notifications.
     * Shows incoming call notification or cancels existing one based on status.
     */
    private void handleVideoConfNotification(Bundle bundle, Ejson ejson) {
        VideoConfNotification videoConf = new VideoConfNotification(mContext);
        
        Integer status = ejson.status;
        String rid = ejson.rid;
        // Video conf uses 'caller' field, regular messages use 'sender'
        String callerId = "";
        if (ejson.caller != null && ejson.caller._id != null) {
            callerId = ejson.caller._id;
        } else if (ejson.sender != null && ejson.sender._id != null) {
            callerId = ejson.sender._id;
        }
        
        Log.d(TAG, "Video conf notification - status: " + status + ", rid: " + rid);
        
        if (status == null || status == 0) {
            // Incoming call - show notification
            videoConf.showIncomingCall(bundle, ejson);
        } else if (status == 4) {
            // Call cancelled/ended - dismiss notification
            videoConf.cancelCall(rid, callerId);
        } else {
            Log.d(TAG, "Unknown video conf status: " + status);
        }
    }

    private void postNotification(int notificationId) {
        Notification.Builder notification = buildNotification(notificationId);
        if (notification != null && notificationManager != null) {
            notificationManager.notify(notificationId, notification.build());
        }
    }
    
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            );
            if (notificationManager != null) {
                notificationManager.createNotificationChannel(channel);
            }
        }
    }

    private Notification.Builder buildNotification(int notificationId) {
        String title = mBundle.getString("title");
        String message = mBundle.getString("message");
        Boolean notificationLoaded = mBundle.getBoolean("notificationLoaded", false);
        Ejson ejson = safeFromJson(mBundle.getString("ejson", "{}"), Ejson.class);

        // Determine the correct title based on notification type
        String notificationTitle = title;
        if (ejson != null && ejson.type != null) {
            if ("p".equals(ejson.type) || "c".equals(ejson.type)) {
                // For groups/channels, use room name if available, otherwise fall back to title
                notificationTitle = (ejson.name != null && !ejson.name.isEmpty()) ? ejson.name : title;
            } else if ("d".equals(ejson.type)) {
                // For direct messages, use title (sender name from server)
                notificationTitle = title;
            } else if ("l".equals(ejson.type)) {
                // For omnichannel, use sender name if available, otherwise fall back to title
                notificationTitle = (ejson.sender != null && ejson.sender.name != null && !ejson.sender.name.isEmpty()) 
                    ? ejson.sender.name : title;
            }
        }

        // Create pending intent to open the app
        Intent intent = new Intent(mContext, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        intent.putExtras(mBundle);
        
        PendingIntent pendingIntent;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            pendingIntent = PendingIntent.getActivity(mContext, notificationId, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        } else {
            pendingIntent = PendingIntent.getActivity(mContext, notificationId, intent, PendingIntent.FLAG_UPDATE_CURRENT);
        }

        Notification.Builder notification;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            notification = new Notification.Builder(mContext, CHANNEL_ID);
        } else {
            notification = new Notification.Builder(mContext);
        }

        notification
                .setContentTitle(notificationTitle)
                .setContentText(message)
                .setContentIntent(pendingIntent)
                .setPriority(Notification.PRIORITY_HIGH)
                .setDefaults(Notification.DEFAULT_ALL)
                .setAutoCancel(true);

        notificationColor(notification);
        notificationIcons(notification, mBundle);
        notificationDismiss(notification, notificationId);

        // if notificationType is null (RC < 3.5) or notificationType is different of message-id-only or notification was loaded successfully
        if (ejson == null || ejson.notificationType == null || !ejson.notificationType.equals("message-id-only") || notificationLoaded) {
            Log.i(TAG, "[buildNotification] ✅ Rendering FULL notification style");
            notificationStyle(notification, notificationId, mBundle);
            notificationReply(notification, notificationId, mBundle);
        } else {
            Log.w(TAG, "[buildNotification] ⚠️ Rendering FALLBACK notification");
            // Cancel previous fallback notifications from same server
            cancelPreviousFallbackNotifications(ejson);
        }

        return notification;
    }
    
    private void cancelPreviousFallbackNotifications(Ejson ejson) {
        for (Map.Entry<String, List<Bundle>> bundleList : notificationMessages.entrySet()) {
            Iterator<Bundle> iterator = bundleList.getValue().iterator();
            while (iterator.hasNext()) {
                Bundle not = iterator.next();
                Ejson notEjson = safeFromJson(not.getString("ejson", "{}"), Ejson.class);
                if (ejson != null && notEjson != null && ejson.serverURL().equals(notEjson.serverURL())) {
                    String id = not.getString("notId");
                    if (notificationManager != null && id != null) {
                        try {
                            notificationManager.cancel(Integer.parseInt(id));
                            if (ENABLE_VERBOSE_LOGS) {
                                Log.d(TAG, "Cancelled previous fallback notification from same server");
                            }
                        } catch (NumberFormatException e) {
                            Log.e(TAG, "Invalid notification ID for cancel: " + id, e);
                        }
                    }
                }
            }
        }
    }

    private Bitmap getAvatar(String uri) {
        return NotificationHelper.fetchAvatarBitmap(mContext, uri, largeIcon());
    }

    private Bitmap largeIcon() {
        final Resources res = mContext.getResources();
        String packageName = mContext.getPackageName();
        int largeIconResId = res.getIdentifier("ic_notification", "drawable", packageName);
        return BitmapFactory.decodeResource(res, largeIconResId);
    }

    private void notificationIcons(Notification.Builder notification, Bundle bundle) {
        final Resources res = mContext.getResources();
        String packageName = mContext.getPackageName();
        int smallIconResId = res.getIdentifier("ic_notification", "drawable", packageName);
        Ejson ejson = safeFromJson(bundle.getString("ejson", "{}"), Ejson.class);

        notification.setSmallIcon(smallIconResId);

        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) {
            String avatarUri = ejson != null ? ejson.getAvatarUri() : null;
            if (avatarUri != null) {
                Bitmap avatar = getAvatar(avatarUri);
                if (avatar != null) {
                    notification.setLargeIcon(avatar);
                }
            }
        }
    }

    private String extractMessage(String message, Ejson ejson) {
        if (message == null) {
            return "";
        }
        if (ejson != null && ejson.type != null && !ejson.type.equals("d")) {
            int pos = message.indexOf(":");
            if (pos == -1) {
                return message;
            }
            int start = pos + 2;
            return start <= message.length() ? message.substring(start) : "";
        }
        return message;
    }

    private void notificationColor(Notification.Builder notification) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            notification.setColor(mContext.getColor(R.color.notification_text));
        }
    }

    private void notificationStyle(Notification.Builder notification, int notId, Bundle bundle) {
        List<Bundle> bundles = notificationMessages.get(Integer.toString(notId));


        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) {
            Notification.InboxStyle messageStyle = new Notification.InboxStyle();
            if (bundles != null) {
                for (Bundle data : bundles) {
                    String message = data.getString("message");
                    messageStyle.addLine(message);
                }
            }
            notification.setStyle(messageStyle);
        } else {
            Notification.MessagingStyle messageStyle;

            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) {
                messageStyle = new Notification.MessagingStyle("");
            } else {
                Person sender = new Person.Builder()
                        .setKey("")
                        .setName("")
                        .build();
                messageStyle = new Notification.MessagingStyle(sender);
            }

            String title = bundle.getString("title");
            // Determine the correct conversation title based on notification type
            Ejson bundleEjson = safeFromJson(bundle.getString("ejson", "{}"), Ejson.class);
            String conversationTitle = title;
            if (bundleEjson != null && bundleEjson.type != null) {
                if ("p".equals(bundleEjson.type) || "c".equals(bundleEjson.type)) {
                    // For groups/channels, use room name if available, otherwise fall back to title
                    conversationTitle = (bundleEjson.name != null && !bundleEjson.name.isEmpty()) ? bundleEjson.name : title;
                } else if ("d".equals(bundleEjson.type)) {
                    // For direct messages, use title (sender name from server)
                    conversationTitle = title;
                } else if ("l".equals(bundleEjson.type)) {
                    // For omnichannel, use sender name if available, otherwise fall back to title
                    conversationTitle = (bundleEjson.sender != null && bundleEjson.sender.name != null && !bundleEjson.sender.name.isEmpty()) 
                        ? bundleEjson.sender.name : title;
                }
            }
            messageStyle.setConversationTitle(conversationTitle);

            if (bundles != null) {
                for (Bundle data : bundles) {
                    long timestamp = data.getLong("time");
                    String message = data.getString("message");
                    String senderId = data.getString("senderId");
                    String avatarUri = data.getString("avatarUri");
                    Ejson ejson = safeFromJson(data.getString("ejson", "{}"), Ejson.class);
                    String m = extractMessage(message, ejson);

                    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) {
                        String senderName = ejson != null ? ejson.senderName : "Unknown";
                        messageStyle.addMessage(m, timestamp, senderName);
                    } else {
                        Bitmap avatar = getAvatar(avatarUri);
                        String senderName = ejson != null ? ejson.senderName : "Unknown";
                        Person.Builder senderBuilder = new Person.Builder()
                                .setKey(senderId)
                                .setName(senderName);

                        if (avatar != null) {
                            senderBuilder.setIcon(Icon.createWithBitmap(avatar));
                        }

                        Person person = senderBuilder.build();
                        messageStyle.addMessage(m, timestamp, person);
                    }
                }
            }

            notification.setStyle(messageStyle);
        }
    }

    private void notificationReply(Notification.Builder notification, int notificationId, Bundle bundle) {
        String notId = bundle.getString("notId", "1");
        String ejson = bundle.getString("ejson", "{}");
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N || notId.equals("1") || ejson.equals("{}")) {
            return;
        }
        String label = "Reply";

        final Resources res = mContext.getResources();
        String packageName = mContext.getPackageName();
        int smallIconResId = res.getIdentifier("ic_notification", "drawable", packageName);

        Intent replyIntent = new Intent(mContext, ReplyBroadcast.class);
        replyIntent.setAction(KEY_REPLY);
        replyIntent.putExtra("pushNotification", bundle);

        PendingIntent replyPendingIntent;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            replyPendingIntent = PendingIntent.getBroadcast(mContext, notificationId, replyIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_MUTABLE);
        } else {
            replyPendingIntent = PendingIntent.getBroadcast(mContext, notificationId, replyIntent, PendingIntent.FLAG_UPDATE_CURRENT);
        }

        RemoteInput remoteInput = new RemoteInput.Builder(KEY_REPLY)
                .setLabel(label)
                .build();

        Notification.Action replyAction = new Notification.Action.Builder(smallIconResId, label, replyPendingIntent)
                .addRemoteInput(remoteInput)
                .setAllowGeneratedReplies(true)
                .build();

        notification
                .setShowWhen(true)
                .addAction(replyAction);
    }

    private void notificationDismiss(Notification.Builder notification, int notificationId) {
        Intent intent = new Intent(mContext, DismissNotification.class);
        intent.putExtra(NOTIFICATION_ID, notificationId);

        PendingIntent dismissPendingIntent = PendingIntent.getBroadcast(mContext, notificationId, intent, PendingIntent.FLAG_ONE_SHOT | PendingIntent.FLAG_IMMUTABLE);

        notification.setDeleteIntent(dismissPendingIntent);
    }

    private void notificationLoad(Ejson ejson, Callback callback) {
        LoadNotification loadNotification = new LoadNotification();
        loadNotification.load(ejson, callback);
    }
    
    /**
     * Safely parses JSON string to object with error handling.
     */
    private static <T> T safeFromJson(String json, Class<T> classOfT) {
        if (json == null || json.trim().isEmpty() || json.equals("{}")) {
            return null;
        }

        try {
            return gson.fromJson(json, classOfT);
        } catch (Exception e) {
            Log.e(TAG, "Failed to parse JSON into " + classOfT.getSimpleName(), e);
            return null;
        }
    }
}
