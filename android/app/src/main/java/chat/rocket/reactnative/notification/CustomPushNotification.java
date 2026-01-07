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

import com.bumptech.glide.Glide;
import com.bumptech.glide.load.resource.bitmap.RoundedCorners;
import com.bumptech.glide.request.RequestOptions;
import com.facebook.react.bridge.ReactApplicationContext;
import com.google.gson.Gson;

import java.util.ArrayList;
import java.util.Date;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

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
    
    // Constants
    public static final String KEY_REPLY = "KEY_REPLY";
    public static final String NOTIFICATION_ID = "NOTIFICATION_ID";
    private static final String CHANNEL_ID = "rocketchatrn_channel_01";
    private static final String CHANNEL_NAME = "All";
    
    // Instance fields
    private final Context mContext;
    private Bundle mBundle;
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
     */
    public static void setReactContext(ReactApplicationContext context) {
        reactApplicationContext = context;
    }

    public static void clearMessages(int notId) {
        notificationMessages.remove(Integer.toString(notId));
    }
    
    /**
     * Check if React Native is initialized
     */
    private boolean isReactInitialized() {
        return reactApplicationContext != null;
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
        
        // Check if React is ready - needed for MMKV access (avatars, encryption, message-id-only)
        if (!isReactInitialized()) {
            Log.w(TAG, "React not initialized yet, waiting before processing notification...");
            
            // Wait for React to initialize with timeout
            new Thread(() -> {
                int attempts = 0;
                int maxAttempts = 50; // 5 seconds total (50 * 100ms)
                
                while (!isReactInitialized() && attempts < maxAttempts) {
                    try {
                        Thread.sleep(100); // Wait 100ms
                        attempts++;
                        
                        if (attempts % 10 == 0 && ENABLE_VERBOSE_LOGS) {
                            Log.d(TAG, "Still waiting for React initialization... (" + (attempts * 100) + "ms elapsed)");
                        }
                    } catch (InterruptedException e) {
                        Log.e(TAG, "Wait interrupted", e);
                        Thread.currentThread().interrupt();
                        return;
                    }
                }
                
                if (isReactInitialized()) {
                    Log.i(TAG, "React initialized after " + (attempts * 100) + "ms, proceeding with notification");
                    try {
                        handleNotification();
                    } catch (Exception e) {
                        Log.e(TAG, "Failed to process notification after React initialization", e);
                    }
                } else {
                    Log.e(TAG, "Timeout waiting for React initialization after " + (maxAttempts * 100) + "ms, processing without MMKV");
                    try {
                        handleNotification();
                    } catch (Exception e) {
                        Log.e(TAG, "Failed to process notification without React context", e);
                    }
                }
            }).start();
            
            return; // Exit early, notification will be processed in the thread
        }
        
        if (ENABLE_VERBOSE_LOGS) {
            Log.d(TAG, "React already initialized, proceeding with notification");
        }
        
        try {
            handleNotification();
        } catch (Exception e) {
            Log.e(TAG, "Failed to process notification on main thread", e);
        }
    }
    
    private void handleNotification() {
        Ejson receivedEjson = safeFromJson(mBundle.getString("ejson", "{}"), Ejson.class);

        if (receivedEjson != null && receivedEjson.notificationType != null && receivedEjson.notificationType.equals("message-id-only")) {
            Log.d(TAG, "Detected message-id-only notification, will fetch full content from server");
            loadNotificationAndProcess(receivedEjson);
            return; // Exit early, notification will be processed in callback
        }

        // For non-message-id-only notifications, process immediately
        processNotification();
    }
    
    private void loadNotificationAndProcess(Ejson ejson) {
        notificationLoad(ejson, new Callback() {
            @Override
            public void call(@Nullable Bundle bundle) {
                if (bundle != null) {
                    Log.d(TAG, "Successfully loaded notification content from server, updating notification props");
                    
                    if (ENABLE_VERBOSE_LOGS) {
                        Log.d(TAG, "[BEFORE update] bundle.notificationLoaded=" + bundle.getBoolean("notificationLoaded", false));
                        Log.d(TAG, "[BEFORE update] bundle.title=" + (bundle.getString("title") != null ? "[present]" : "[null]"));
                        Log.d(TAG, "[BEFORE update] bundle.message length=" + (bundle.getString("message") != null ? bundle.getString("message").length() : 0));
                    }
                    
                    synchronized(CustomPushNotification.this) {
                        mBundle = bundle;
                    }
                } else {
                    Log.w(TAG, "Failed to load notification content from server, will display placeholder notification");
                }
                
                processNotification();
            }
        });
    }
    
    private void processNotification() {
        Ejson loadedEjson = safeFromJson(mBundle.getString("ejson", "{}"), Ejson.class);
        String notId = mBundle.getString("notId", "1");

        if (ENABLE_VERBOSE_LOGS) {
            Log.d(TAG, "[processNotification] notId=" + notId);
            Log.d(TAG, "[processNotification] bundle.notificationLoaded=" + mBundle.getBoolean("notificationLoaded", false));
            Log.d(TAG, "[processNotification] bundle.title=" + (mBundle.getString("title") != null ? "[present]" : "[null]"));
            Log.d(TAG, "[processNotification] bundle.message length=" + (mBundle.getString("message") != null ? mBundle.getString("message").length() : 0));
            Log.d(TAG, "[processNotification] loadedEjson.notificationType=" + (loadedEjson != null ? loadedEjson.notificationType : "null"));
            Log.d(TAG, "[processNotification] loadedEjson.sender=" + (loadedEjson != null && loadedEjson.sender != null ? loadedEjson.sender.username : "null"));
        }

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
     * Handles E2E encrypted notifications
     */
    private void handleE2ENotification(Bundle bundle, Ejson ejson, String notId) {
        String decrypted = Encryption.shared.decryptMessage(ejson, mContext);
        
        if (decrypted != null) {
            bundle.putString("message", decrypted);
            mBundle = bundle;
            Ejson updatedEjson = safeFromJson(bundle.getString("ejson", "{}"), Ejson.class);
            showNotification(bundle, updatedEjson, notId);
        } else {
            Log.w(TAG, "E2E decryption failed for notification");
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
        if (ENABLE_VERBOSE_LOGS) {
            Log.d(TAG, "[showNotification] avatarUri=" + (avatarUri != null ? "[present]" : "[null]"));
        }
        bundle.putString("avatarUri", avatarUri);

        // Handle special notification types
        if (ejson != null && "videoconf".equals(ejson.notificationType)) {
            handleVideoConfNotification(bundle, ejson);
            return;
        } else {
            // Show regular notification
            if (ENABLE_VERBOSE_LOGS) {
                Log.d(TAG, "[Before add to notificationMessages] notId=" + notId + ", bundle.message length=" + (bundle.getString("message") != null ? bundle.getString("message").length() : 0) + ", bundle.notificationLoaded=" + bundle.getBoolean("notificationLoaded", false));
            }
            notificationMessages.get(notId).add(bundle);
            if (ENABLE_VERBOSE_LOGS) {
                Log.d(TAG, "[After add] notificationMessages[" + notId + "].size=" + notificationMessages.get(notId).size());
            }
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
        String notId = Integer.toString(notificationId);
        String title = mBundle.getString("title");
        String message = mBundle.getString("message");
        Boolean notificationLoaded = mBundle.getBoolean("notificationLoaded", false);
        Ejson ejson = safeFromJson(mBundle.getString("ejson", "{}"), Ejson.class);

        if (ENABLE_VERBOSE_LOGS) {
            Log.d(TAG, "[buildNotification] notId=" + notId);
            Log.d(TAG, "[buildNotification] notificationLoaded=" + notificationLoaded);
            Log.d(TAG, "[buildNotification] title=" + (title != null ? "[present]" : "[null]"));
            Log.d(TAG, "[buildNotification] message length=" + (message != null ? message.length() : 0));
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
                .setContentTitle(title)
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
        if (uri == null || uri.isEmpty()) {
            if (ENABLE_VERBOSE_LOGS) {
                Log.w(TAG, "getAvatar called with null/empty URI");
            }
            return largeIcon();
        }
        
        if (ENABLE_VERBOSE_LOGS) {
            String sanitizedUri = uri;
            int queryStart = uri.indexOf("?");
            if (queryStart != -1) {
                sanitizedUri = uri.substring(0, queryStart) + "?[auth_params]";
            }
            Log.d(TAG, "Fetching avatar from: " + sanitizedUri);
        }
        
        try {
            // Use a 3-second timeout to avoid blocking the FCM service for too long
            // FCM has a 10-second limit, so we need to fail fast and use fallback icon
            Bitmap avatar = Glide.with(mContext)
                    .asBitmap()
                    .apply(RequestOptions.bitmapTransform(new RoundedCorners(10)))
                    .load(uri)
                    .submit(100, 100)
                    .get(3, TimeUnit.SECONDS);
            
            return avatar != null ? avatar : largeIcon();
        } catch (final ExecutionException | InterruptedException | TimeoutException e) {
            Log.e(TAG, "Failed to fetch avatar: " + e.getMessage(), e);
            return largeIcon();
        }
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
                notification.setLargeIcon(getAvatar(avatarUri));
            }
        }
    }

    private String extractMessage(String message, Ejson ejson) {
        if (message == null) {
            return "";
        }
        if (ejson != null && ejson.type != null && !ejson.type.equals("d")) {
            int pos = message.indexOf(":");
            int start = pos == -1 ? 0 : pos + 2;
            return message.substring(start);
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

        if (ENABLE_VERBOSE_LOGS) {
            Log.d(TAG, "[notificationStyle] notId=" + notId + ", bundles=" + (bundles != null ? bundles.size() : "null"));
        }

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
            messageStyle.setConversationTitle(title);

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
