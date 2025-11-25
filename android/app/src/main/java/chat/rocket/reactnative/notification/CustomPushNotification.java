package chat.rocket.reactnative.notification;

import static com.wix.reactnativenotifications.Defs.NOTIFICATION_RECEIVED_EVENT_NAME;

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
import com.wix.reactnativenotifications.core.AppLaunchHelper;
import com.wix.reactnativenotifications.core.AppLifecycleFacade;
import com.wix.reactnativenotifications.core.JsIOHelper;
import com.wix.reactnativenotifications.core.notification.PushNotification;

import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

import chat.rocket.reactnative.R;

/**
 * Custom push notification handler for Rocket.Chat.
 * 
 * Handles standard push notifications and End-to-End encrypted (E2E) notifications.
 * For E2E notifications, waits for React Native initialization before decrypting and displaying.
 */
public class CustomPushNotification extends PushNotification {
    private static final String TAG = "RocketChat.Push";
    
    // Shared state
    public static ReactApplicationContext reactApplicationContext;
    private static final Gson gson = new Gson();
    private static final Map<String, List<Bundle>> notificationMessages = new HashMap<>();
    
    // Constants
    public static final String KEY_REPLY = "KEY_REPLY";
    public static final String NOTIFICATION_ID = "NOTIFICATION_ID";
    
    // Instance fields
    final NotificationManager notificationManager;
    
    public CustomPushNotification(Context context, Bundle bundle, AppLifecycleFacade appLifecycleFacade, 
                                 AppLaunchHelper appLaunchHelper, JsIOHelper jsIoHelper) {
        super(context, bundle, appLifecycleFacade, appLaunchHelper, jsIoHelper);
        notificationManager = (NotificationManager) mContext.getSystemService(Context.NOTIFICATION_SERVICE);
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

    @Override
    public void onReceived() throws InvalidNotificationException {
        
        // Load notification data from server if needed
        Bundle received = mNotificationProps.asBundle();
        Ejson receivedEjson = safeFromJson(received.getString("ejson", "{}"), Ejson.class);

        if (receivedEjson != null && receivedEjson.notificationType != null && 
            receivedEjson.notificationType.equals("message-id-only")) {
            notificationLoad(receivedEjson, new Callback() {
                @Override
                public void call(@Nullable Bundle bundle) {
                    if (bundle != null) {
                        mNotificationProps = createProps(bundle);
                    }
                }
            });
        }

        // Re-read values (may have changed from notificationLoad)
        Bundle bundle = mNotificationProps.asBundle();
        Ejson loadedEjson = safeFromJson(bundle.getString("ejson", "{}"), Ejson.class);
        String notId = bundle.getString("notId", "1");

        // Handle E2E encrypted notifications
        if (isE2ENotification(loadedEjson)) {
            handleE2ENotification(bundle, loadedEjson, notId);
            return; // E2E processor will handle showing the notification
        }

        // Handle regular (non-E2E) notifications
        showNotification(bundle, loadedEjson, notId);
    }

    /**
     * Checks if this is an E2E encrypted notification.
     */
    private boolean isE2ENotification(Ejson ejson) {
        return ejson != null && "e2e".equals(ejson.messageType);
    }

    /**
     * Handles E2E encrypted notifications by delegating to the async processor.
     */
    private void handleE2ENotification(Bundle bundle, Ejson ejson, String notId) {
        // Check if React context is immediately available
        if (reactApplicationContext != null) {
            // Fast path: decrypt immediately
            String decrypted = Encryption.shared.decryptMessage(ejson, reactApplicationContext);
            
            if (decrypted != null) {
                bundle.putString("message", decrypted);
                mNotificationProps = createProps(bundle);
                bundle = mNotificationProps.asBundle();
                ejson = safeFromJson(bundle.getString("ejson", "{}"), Ejson.class);
                showNotification(bundle, ejson, notId);
            } else {
                Log.w(TAG, "E2E decryption failed for notification");
            }
            return;
        }
        
        // Slow path: wait for React context asynchronously
        Log.i(TAG, "Waiting for React context to decrypt E2E notification");
        
        E2ENotificationProcessor processor = new E2ENotificationProcessor(
            // Context provider
            () -> reactApplicationContext,
            
            // Callback
            new E2ENotificationProcessor.NotificationCallback() {
                @Override
                public void onDecryptionComplete(Bundle decryptedBundle, Ejson decryptedEjson, String notificationId) {
                    // Update props and show notification
                    mNotificationProps = createProps(decryptedBundle);
                    Bundle finalBundle = mNotificationProps.asBundle();
                    Ejson finalEjson = safeFromJson(finalBundle.getString("ejson", "{}"), Ejson.class);
                    showNotification(finalBundle, finalEjson, notificationId);
                }
                
                @Override
                public void onDecryptionFailed(Bundle originalBundle, Ejson originalEjson, String notificationId) {
                    Log.w(TAG, "E2E decryption failed for notification");
                }
                
                @Override
                public void onTimeout(Bundle originalBundle, Ejson originalEjson, String notificationId) {
                    Log.w(TAG, "Timeout waiting for React context for E2E notification");
                }
            }
        );
        
        processor.processAsync(bundle, ejson, notId);
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
        bundle.putString("avatarUri", ejson != null ? ejson.getAvatarUri() : null);

        // Handle special notification types
        if (ejson != null && ejson.notificationType instanceof String && 
            ejson.notificationType.equals("videoconf")) {
            notifyReceivedToJS();
        } else {
            // Show regular notification
            notificationMessages.get(notId).add(bundle);
            postNotification(Integer.parseInt(notId));
            notifyReceivedToJS();
        }
    }

    @Override
    public void onOpened() {
        Bundle bundle = mNotificationProps.asBundle();
        final String notId = bundle.getString("notId", "1");
        notificationMessages.remove(notId);
        digestNotification();
    }

    @Override
    protected Notification.Builder getNotificationBuilder(PendingIntent intent) {
        final Notification.Builder notification = new Notification.Builder(mContext);

        Bundle bundle = mNotificationProps.asBundle();
        String notId = bundle.getString("notId", "1");
        String title = bundle.getString("title");
        String message = bundle.getString("message");
        Boolean notificationLoaded = bundle.getBoolean("notificationLoaded", false);
        Ejson ejson = safeFromJson(bundle.getString("ejson", "{}"), Ejson.class);

        notification
                .setContentTitle(title)
                .setContentText(message)
                .setContentIntent(intent)
                .setPriority(Notification.PRIORITY_HIGH)
                .setDefaults(Notification.DEFAULT_ALL)
                .setAutoCancel(true);

        Integer notificationId = Integer.parseInt(notId);
        notificationColor(notification);
        notificationChannel(notification);
        notificationIcons(notification, bundle);
        notificationDismiss(notification, notificationId);

        // if notificationType is null (RC < 3.5) or notificationType is different of message-id-only or notification was loaded successfully
        if (ejson == null || ejson.notificationType == null || !ejson.notificationType.equals("message-id-only") || notificationLoaded) {
            notificationStyle(notification, notificationId, bundle);
            notificationReply(notification, notificationId, bundle);

            // message couldn't be loaded from server (Fallback notification)
        } else {
            // iterate over the current notification ids to dismiss fallback notifications from same server
            for (Map.Entry<String, List<Bundle>> bundleList : notificationMessages.entrySet()) {
                // iterate over the notifications with this id (same host + rid)
                Iterator iterator = bundleList.getValue().iterator();
                while (iterator.hasNext()) {
                    Bundle not = (Bundle) iterator.next();
                    // get the notification info
                    Ejson notEjson = safeFromJson(not.getString("ejson", "{}"), Ejson.class);
                    // if already has a notification from same server
                    if (ejson != null && notEjson != null && ejson.serverURL().equals(notEjson.serverURL())) {
                        String id = not.getString("notId");
                        // cancel this notification
                        notificationManager.cancel(Integer.parseInt(id));
                    }
                }
            }
        }

        return notification;
    }

    private void notifyReceivedToJS() {
        boolean isReactInitialized = mAppLifecycleFacade.isReactInitialized();
        if (isReactInitialized) {
            mJsIOHelper.sendEventToJS(NOTIFICATION_RECEIVED_EVENT_NAME, mNotificationProps.asBundle(), mAppLifecycleFacade.getRunningReactContext());
        }
    }

    private Bitmap getAvatar(String uri) {
        try {
            return Glide.with(mContext)
                    .asBitmap()
                    .apply(RequestOptions.bitmapTransform(new RoundedCorners(10)))
                    .load(uri)
                    .submit(100, 100)
                    .get();
        } catch (final ExecutionException | InterruptedException e) {
            return largeIcon();
        }
    }

    private Bitmap largeIcon() {
        final Resources res = mContext.getResources();
        String packageName = mContext.getPackageName();
        int largeIconResId = res.getIdentifier("ic_notification", "drawable", packageName);
        Bitmap largeIconBitmap = BitmapFactory.decodeResource(res, largeIconResId);
        return largeIconBitmap;
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

    private void notificationChannel(Notification.Builder notification) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            String CHANNEL_ID = "rocketchatrn_channel_01";
            String CHANNEL_NAME = "All";

            // User-visible importance level: Urgent - Makes a sound and appears as a heads-up notification
            // https://developer.android.com/training/notify-user/channels#importance
            NotificationChannel channel = new NotificationChannel(CHANNEL_ID,
                    CHANNEL_NAME,
                    NotificationManager.IMPORTANCE_HIGH);

            final NotificationManager notificationManager = (NotificationManager) mContext.getSystemService(Context.NOTIFICATION_SERVICE);
            notificationManager.createNotificationChannel(channel);

            notification.setChannelId(CHANNEL_ID);
        }
    }

    private String extractMessage(String message, Ejson ejson) {
        if (message == null) {
            return "";
        }
        if (ejson != null && ejson.type != null && !ejson.type.equals("d")) {
            int pos = message.indexOf(":");
            int start = pos == -1 ? 0 : pos + 2;
            return message.substring(start, message.length());
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
                for (int i = 0; i < bundles.size(); i++) {
                    Bundle data = bundles.get(i);
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
                for (int i = 0; i < bundles.size(); i++) {
                    Bundle data = bundles.get(i);

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
                        Person.Builder sender = new Person.Builder()
                                .setKey(senderId)
                                .setName(senderName);

                        if (avatar != null) {
                            sender.setIcon(Icon.createWithBitmap(avatar));
                        }

                        Person person = sender.build();

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

        CharSequence title = label;
        Notification.Action replyAction = new Notification.Action.Builder(smallIconResId, title, replyPendingIntent)
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
        loadNotification.load(reactApplicationContext, ejson, callback);
    }
    
    /**
     * Safely parses JSON string to object with error handling.
     *
     * @param json     JSON string to parse
     * @param classOfT Target class type
     * @param <T>      Type parameter
     * @return Parsed object, or null if parsing fails
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
