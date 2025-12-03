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
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutionException;

import chat.rocket.reactnative.BuildConfig;
import chat.rocket.reactnative.R;

/**
 * Custom push notification handler for Rocket.Chat.
 * 
 * Handles standard push notifications and End-to-End encrypted (E2E) notifications.
 * For E2E notifications, waits for React Native initialization before decrypting and displaying.
 */
public class CustomPushNotification extends PushNotification {
    private static final String TAG = "RocketChat.CustomPush";
    private static final boolean ENABLE_VERBOSE_LOGS = BuildConfig.DEBUG;
    
    // Shared state
    public static volatile ReactApplicationContext reactApplicationContext;
    private static final Gson gson = new Gson();
    private static final Map<String, List<Bundle>> notificationMessages = new ConcurrentHashMap<>();
    
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
        Bundle bundle = mNotificationProps.asBundle();
        String notId = bundle.getString("notId");
        
        if (notId == null || notId.isEmpty()) {
            throw new InvalidNotificationException("Missing notification ID");
        }
        
        try {
            Integer.parseInt(notId);
        } catch (NumberFormatException e) {
            throw new InvalidNotificationException("Invalid notification ID format: " + notId);
        }
        
        // Check if React is ready - needed for MMKV access (avatars, encryption, message-id-only)
        if (!mAppLifecycleFacade.isReactInitialized()) {
            android.util.Log.w(TAG, "React not initialized yet, waiting before processing notification...");
            
            // Wait for React to initialize with timeout
            new Thread(() -> {
                int attempts = 0;
                int maxAttempts = 50; // 5 seconds total (50 * 100ms)
                
                while (!mAppLifecycleFacade.isReactInitialized() && attempts < maxAttempts) {
                    try {
                        Thread.sleep(100); // Wait 100ms
                        attempts++;
                        
                        if (attempts % 10 == 0 && ENABLE_VERBOSE_LOGS) {
                            android.util.Log.d(TAG, "Still waiting for React initialization... (" + (attempts * 100) + "ms elapsed)");
                        }
                    } catch (InterruptedException e) {
                        android.util.Log.e(TAG, "Wait interrupted", e);
                        Thread.currentThread().interrupt();
                        return;
                    }
                }
                
                if (mAppLifecycleFacade.isReactInitialized()) {
                    android.util.Log.i(TAG, "React initialized after " + (attempts * 100) + "ms, proceeding with notification");
                    try {
                        handleNotification();
                    } catch (Exception e) {
                        android.util.Log.e(TAG, "Failed to process notification after React initialization", e);
                    }
                } else {
                    android.util.Log.e(TAG, "Timeout waiting for React initialization after " + (maxAttempts * 100) + "ms, processing without MMKV");
                    try {
                        handleNotification();
                    } catch (Exception e) {
                        android.util.Log.e(TAG, "Failed to process notification without React context", e);
                    }
                }
            }).start();
            
            return; // Exit early, notification will be processed in the thread
        }
        
        if (ENABLE_VERBOSE_LOGS) {
            android.util.Log.d(TAG, "React already initialized, proceeding with notification");
        }
        
        try {
            handleNotification();
        } catch (Exception e) {
            android.util.Log.e(TAG, "Failed to process notification on main thread", e);
            throw new InvalidNotificationException("Notification processing failed: " + e.getMessage());
        }
    }
    
    private void handleNotification() {
        Bundle received = mNotificationProps.asBundle();
        Ejson receivedEjson = safeFromJson(received.getString("ejson", "{}"), Ejson.class);

        if (receivedEjson != null && receivedEjson.notificationType != null && receivedEjson.notificationType.equals("message-id-only")) {
            android.util.Log.d(TAG, "Detected message-id-only notification, will fetch full content from server");
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
                    android.util.Log.d(TAG, "Successfully loaded notification content from server, updating notification props");
                    
                    if (ENABLE_VERBOSE_LOGS) {
                        // BEFORE createProps
                        android.util.Log.d(TAG, "[BEFORE createProps] bundle.notificationLoaded=" + bundle.getBoolean("notificationLoaded", false));
                        android.util.Log.d(TAG, "[BEFORE createProps] bundle.title=" + (bundle.getString("title") != null ? "[present]" : "[null]"));
                        android.util.Log.d(TAG, "[BEFORE createProps] bundle.message length=" + (bundle.getString("message") != null ? bundle.getString("message").length() : 0));
                        android.util.Log.d(TAG, "[BEFORE createProps] bundle has ejson=" + (bundle.getString("ejson") != null));
                    }
                    
                    synchronized(CustomPushNotification.this) {
                        mNotificationProps = createProps(bundle);
                    }
                    
                    if (ENABLE_VERBOSE_LOGS) {
                        // AFTER createProps - verify it worked
                        Bundle verifyBundle = mNotificationProps.asBundle();
                        android.util.Log.d(TAG, "[AFTER createProps] mNotificationProps.notificationLoaded=" + verifyBundle.getBoolean("notificationLoaded", false));
                        android.util.Log.d(TAG, "[AFTER createProps] mNotificationProps.title=" + (verifyBundle.getString("title") != null ? "[present]" : "[null]"));
                        android.util.Log.d(TAG, "[AFTER createProps] mNotificationProps.message length=" + (verifyBundle.getString("message") != null ? verifyBundle.getString("message").length() : 0));
                        android.util.Log.d(TAG, "[AFTER createProps] mNotificationProps has ejson=" + (verifyBundle.getString("ejson") != null));
                    }
                } else {
                    android.util.Log.w(TAG, "Failed to load notification content from server, will display placeholder notification");
                }
                
                processNotification();
            }
        });
    }
    
    private void processNotification() {
        // We should re-read these values since that can be changed by notificationLoad
        Bundle bundle = mNotificationProps.asBundle();
        Ejson loadedEjson = safeFromJson(bundle.getString("ejson", "{}"), Ejson.class);
        String notId = bundle.getString("notId", "1");

        if (ENABLE_VERBOSE_LOGS) {
            android.util.Log.d(TAG, "[processNotification] notId=" + notId);
            android.util.Log.d(TAG, "[processNotification] bundle.notificationLoaded=" + bundle.getBoolean("notificationLoaded", false));
            android.util.Log.d(TAG, "[processNotification] bundle.title=" + (bundle.getString("title") != null ? "[present]" : "[null]"));
            android.util.Log.d(TAG, "[processNotification] bundle.message length=" + (bundle.getString("message") != null ? bundle.getString("message").length() : 0));
            android.util.Log.d(TAG, "[processNotification] loadedEjson.notificationType=" + (loadedEjson != null ? loadedEjson.notificationType : "null"));
            android.util.Log.d(TAG, "[processNotification] loadedEjson.sender=" + (loadedEjson != null && loadedEjson.sender != null ? loadedEjson.sender.username : "null"));
        }

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
        
        String avatarUri = ejson != null ? ejson.getAvatarUri() : null;
        if (ENABLE_VERBOSE_LOGS) {
            android.util.Log.d(TAG, "[showNotification] avatarUri=" + (avatarUri != null ? "[present]" : "[null]"));
        }
        bundle.putString("avatarUri", avatarUri);

        // Handle special notification types
        if (ejson != null && ejson.notificationType instanceof String && 
            ejson.notificationType.equals("videoconf")) {
            notifyReceivedToJS();
        } else {
            // Show regular notification
            if (ENABLE_VERBOSE_LOGS) {
                android.util.Log.d(TAG, "[Before add to notificationMessages] notId=" + notId + ", bundle.message length=" + (bundle.getString("message") != null ? bundle.getString("message").length() : 0) + ", bundle.notificationLoaded=" + bundle.getBoolean("notificationLoaded", false));
            }
            notificationMessages.get(notId).add(bundle);
            if (ENABLE_VERBOSE_LOGS) {
                android.util.Log.d(TAG, "[After add] notificationMessages[" + notId + "].size=" + notificationMessages.get(notId).size());
            }
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

        if (ENABLE_VERBOSE_LOGS) {
            android.util.Log.d(TAG, "[getNotificationBuilder] notId=" + notId);
            android.util.Log.d(TAG, "[getNotificationBuilder] notificationLoaded=" + notificationLoaded);
            android.util.Log.d(TAG, "[getNotificationBuilder] title=" + (title != null ? "[present]" : "[null]"));
            android.util.Log.d(TAG, "[getNotificationBuilder] message length=" + (message != null ? message.length() : 0));
            android.util.Log.d(TAG, "[getNotificationBuilder] ejson=" + (ejson != null ? "present" : "null"));
            android.util.Log.d(TAG, "[getNotificationBuilder] ejson.notificationType=" + (ejson != null ? ejson.notificationType : "null"));
            android.util.Log.d(TAG, "[getNotificationBuilder] ejson.sender=" + (ejson != null && ejson.sender != null ? ejson.sender.username : "null"));
        }

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
            android.util.Log.i(TAG, "[getNotificationBuilder] ✅ Rendering FULL notification style (ejson=" + (ejson != null) + ", notificationType=" + (ejson != null ? ejson.notificationType : "null") + ", notificationLoaded=" + notificationLoaded + ")");
            notificationStyle(notification, notificationId, bundle);
            notificationReply(notification, notificationId, bundle);

            // message couldn't be loaded from server (Fallback notification)
        } else {
            android.util.Log.w(TAG, "[getNotificationBuilder] ⚠️ Rendering FALLBACK notification (ejson=" + (ejson != null) + ", notificationType=" + (ejson != null ? ejson.notificationType : "null") + ", notificationLoaded=" + notificationLoaded + ")");
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
                        if (notificationManager != null) {
                            try {
                                notificationManager.cancel(Integer.parseInt(id));
                                if (ENABLE_VERBOSE_LOGS) {
                                    android.util.Log.d(TAG, "Cancelled previous fallback notification from same server");
                                }
                            } catch (NumberFormatException e) {
                                android.util.Log.e(TAG, "Invalid notification ID for cancel: " + id, e);
                            }
                        }
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
        if (uri == null || uri.isEmpty()) {
            if (ENABLE_VERBOSE_LOGS) {
                android.util.Log.w(TAG, "getAvatar called with null/empty URI");
            }
            return largeIcon();
        }
        
        // Sanitize URL for logging (remove query params with tokens)
        String sanitizedUri = uri;
        int queryStart = uri.indexOf("?");
        if (queryStart != -1) {
            sanitizedUri = uri.substring(0, queryStart) + "?[auth_params]";
        }
        
        if (ENABLE_VERBOSE_LOGS) {
            android.util.Log.d(TAG, "Fetching avatar from: " + sanitizedUri);
        }
        
        try {
            Bitmap avatar = Glide.with(mContext)
                    .asBitmap()
                    .apply(RequestOptions.bitmapTransform(new RoundedCorners(10)))
                    .load(uri)
                    .submit(100, 100)
                    .get();
            
            if (avatar != null) {
                if (ENABLE_VERBOSE_LOGS) {
                    android.util.Log.d(TAG, "Successfully loaded avatar");
                }
            } else {
                android.util.Log.w(TAG, "Avatar loaded but is null");
            }
            return avatar != null ? avatar : largeIcon();
        } catch (final ExecutionException | InterruptedException e) {
            android.util.Log.e(TAG, "Failed to fetch avatar: " + e.getMessage(), e);
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
            if (notificationManager != null) {
                notificationManager.createNotificationChannel(channel);
            } else {
                android.util.Log.e(TAG, "NotificationManager is null, cannot create notification channel");
            }

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

        if (ENABLE_VERBOSE_LOGS) {
            android.util.Log.d(TAG, "[notificationStyle] notId=" + notId + ", bundles=" + (bundles != null ? bundles.size() : "null"));
            if (bundles != null && bundles.size() > 0) {
                Bundle firstBundle = bundles.get(0);
                android.util.Log.d(TAG, "[notificationStyle] first bundle.message length=" + (firstBundle.getString("message") != null ? firstBundle.getString("message").length() : 0));
                android.util.Log.d(TAG, "[notificationStyle] first bundle.notificationLoaded=" + firstBundle.getBoolean("notificationLoaded", false));
            }
        }

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
