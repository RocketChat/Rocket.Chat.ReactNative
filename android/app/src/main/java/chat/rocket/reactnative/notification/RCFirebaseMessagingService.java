package chat.rocket.reactnative.notification;

import android.os.Bundle;
import android.util.Log;

import androidx.annotation.NonNull;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import java.util.Map;

/**
 * Custom Firebase Messaging Service for Rocket.Chat.
 * 
 * Handles incoming FCM messages and routes them to CustomPushNotification
 * for advanced processing (E2E decryption, MessagingStyle, direct reply, etc.)
 */
public class RCFirebaseMessagingService extends FirebaseMessagingService {
    private static final String TAG = "RocketChat.FCM";

    @Override
    public void onMessageReceived(@NonNull RemoteMessage remoteMessage) {
        Log.d(TAG, "FCM message received from: " + remoteMessage.getFrom());
        
        Map<String, String> data = remoteMessage.getData();
        if (data.isEmpty()) {
            Log.w(TAG, "FCM message has no data payload, ignoring");
            return;
        }

        // Convert FCM data to Bundle for processing
        Bundle bundle = new Bundle();
        for (Map.Entry<String, String> entry : data.entrySet()) {
            bundle.putString(entry.getKey(), entry.getValue());
        }

        // Process the notification
        try {
            CustomPushNotification notification = new CustomPushNotification(this, bundle);
            notification.onReceived();
        } catch (Exception e) {
            Log.e(TAG, "Error processing FCM message", e);
        }
    }

    @Override
    public void onNewToken(@NonNull String token) {
        Log.d(TAG, "FCM token refreshed");
        // Token handling is done by expo-notifications JS layer
        // which uses getDevicePushTokenAsync()
        super.onNewToken(token);
    }
}
