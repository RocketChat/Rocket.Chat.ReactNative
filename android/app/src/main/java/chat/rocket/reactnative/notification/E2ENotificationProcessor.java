package chat.rocket.reactnative.notification;

import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import com.facebook.react.bridge.ReactApplicationContext;

import java.util.Date;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Handles asynchronous processing of End-to-End encrypted push notifications.
 * 
 * When an E2E notification arrives before React Native is initialized, this processor
 * waits for the React context to become available, decrypts the message, and then
 * triggers the notification display.
 * 
 * Thread-safe and handles timeout scenarios gracefully.
 */
public class E2ENotificationProcessor {
    private static final String TAG = "RocketChat.E2E.Async";
    
    // Configuration constants
    private static final int POLLING_INTERVAL_MS = 100;  // Check every 100ms
    private static final int MAX_WAIT_TIME_MS = 3000;    // Wait up to 3 seconds
    private static final int MAX_ATTEMPTS = MAX_WAIT_TIME_MS / POLLING_INTERVAL_MS;
    
    private final Handler mainHandler;
    private final ReactContextProvider contextProvider;
    private final NotificationCallback callback;
    
    /**
     * Interface to provide React context.
     */
    public interface ReactContextProvider {
        ReactApplicationContext getReactContext();
    }
    
    /**
     * Callback interface for notification processing results.
     */
    public interface NotificationCallback {
        void onDecryptionComplete(Bundle decryptedBundle, Ejson ejson, String notId);
        void onDecryptionFailed(Bundle originalBundle, Ejson ejson, String notId);
        void onTimeout(Bundle originalBundle, Ejson ejson, String notId);
    }
    
    /**
     * Creates a new E2E notification processor.
     * 
     * @param contextProvider Provider for React context
     * @param callback Callback for processing results
     */
    public E2ENotificationProcessor(ReactContextProvider contextProvider, NotificationCallback callback) {
        this.mainHandler = new Handler(Looper.getMainLooper());
        this.contextProvider = contextProvider;
        this.callback = callback;
    }
    
    /**
     * Processes an E2E encrypted notification asynchronously.
     * 
     * This method returns immediately. The notification will be decrypted and shown
     * once React context becomes available, or after a timeout.
     * 
     * @param bundle The notification bundle
     * @param ejson The parsed notification data
     * @param notId The notification ID
     */
    public void processAsync(final Bundle bundle, final Ejson ejson, final String notId) {
        final AtomicInteger attempts = new AtomicInteger(0);
        
        final Runnable pollForContextRunnable = new Runnable() {
            @Override
            public void run() {
                int currentAttempt = attempts.incrementAndGet();
                ReactApplicationContext reactContext = contextProvider.getReactContext();
                
                if (reactContext != null) {
                    // Context is available - decrypt in background thread
                    Log.i(TAG, "React context available after " + currentAttempt + " attempts");
                    decryptAndNotify(reactContext, bundle, ejson, notId);
                    
                } else if (currentAttempt < MAX_ATTEMPTS) {
                    // Context not ready - poll again
                    mainHandler.postDelayed(this, POLLING_INTERVAL_MS);
                    
                } else {
                    // Timeout - give up
                    Log.w(TAG, "Timeout waiting for React context after " + MAX_WAIT_TIME_MS + "ms");
                    handleTimeout(bundle, ejson, notId);
                }
            }
        };
        
        // Start polling
        mainHandler.post(pollForContextRunnable);
    }
    
    /**
     * Decrypts the message in a background thread and invokes the callback on the main thread.
     */
    private void decryptAndNotify(final ReactApplicationContext reactContext, 
                                   final Bundle bundle, 
                                   final Ejson ejson, 
                                   final String notId) {
        // Decrypt in background thread to avoid blocking
        new Thread(() -> {
            try {
                String decrypted = Encryption.shared.decryptMessage(ejson, reactContext);
                
                if (decrypted != null) {
                    bundle.putString("message", decrypted);
                    
                    // Call directly on background thread - notification building needs background thread for image loading
                    try {
                        callback.onDecryptionComplete(bundle, ejson, notId);
                    } catch (Exception e) {
                        Log.e(TAG, "Error in decryption callback", e);
                    }
                    
                } else {
                    Log.w(TAG, "Decryption returned null - failed to decrypt");
                    handleDecryptionFailure(bundle, ejson, notId);
                }
                
            } catch (Exception e) {
                Log.e(TAG, "Exception during decryption", e);
                handleDecryptionFailure(bundle, ejson, notId);
            }
        }, "E2E-Decrypt-" + notId).start();
    }
    
    /**
     * Handles decryption failure by invoking the callback on the current thread.
     */
    private void handleDecryptionFailure(final Bundle bundle, final Ejson ejson, final String notId) {
        try {
            callback.onDecryptionFailed(bundle, ejson, notId);
        } catch (Exception e) {
            Log.e(TAG, "Error in failure callback", e);
        }
    }
    
    /**
     * Handles timeout by invoking the callback on the main thread.
     */
    private void handleTimeout(final Bundle bundle, final Ejson ejson, final String notId) {
        mainHandler.post(() -> {
            try {
                callback.onTimeout(bundle, ejson, notId);
            } catch (Exception e) {
                Log.e(TAG, "Error in timeout callback", e);
            }
        });
    }
}

