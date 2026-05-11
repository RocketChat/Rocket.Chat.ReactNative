package chat.rocket.reactnative.storage;

import android.content.Context;
import android.util.Log;

import com.tencent.mmkv.MMKV;

import java.util.UUID;

/**
 * MMKV Key Manager - Ensures encryption key exists for MMKV storage
 * 
 * The old library (react-native-mmkv-storage) used encryption by default.
 * The new library (react-native-mmkv) requires manually passing the encryption key.
 * 
 * This class:
 * - Reads existing encryption keys from SecureKeystore (for existing users)
 * - Generates new encryption keys for fresh installs
 * - Provides the encryption key to other native code via static getter
 * 
 * Runs synchronously at app startup before React Native initializes.
 */
public class MMKVKeyManager {
    private static final String TAG = "MMKVKeyManager";
    private static final String DEFAULT_INSTANCE_ID = "default";
    
    // Static field to hold the encryption key for other native code
    private static String encryptionKey = null;
    private static Context appContext = null;

    /**
     * Get the MMKV encryption key.
     * Returns null if initialize() hasn't been called yet.
     * 
     * @return The encryption key or null
     */
    public static String getEncryptionKey() {
        return encryptionKey;
    }

    /**
     * Ensures MMKV encryption key exists and caches it for other native code.
     * - For existing users: reads the key from SecureKeystore
     * - For fresh installs: generates a new key and stores it in SecureKeystore
     * 
     * @param context Application context
     */
    public static void initialize(Context context) {
        appContext = context.getApplicationContext();
        
        try {
            Log.i(TAG, "Initializing MMKV encryption...");

            // Initialize MMKV
            MMKV.initialize(context);

            // Get or create the encryption key
            SecureKeystore secureKeystore = new SecureKeystore(context);
            String alias = toHex("com.MMKV." + DEFAULT_INSTANCE_ID);
            String password = secureKeystore.getSecureKey(alias);

            if (password == null || password.isEmpty()) {
                // Fresh install - generate a new encryption key
                Log.i(TAG, "No existing encryption key found, generating new one...");
                password = UUID.randomUUID().toString();
                secureKeystore.setSecureKey(alias, password);
                Log.i(TAG, "New encryption key generated and stored");
            } else {
                Log.i(TAG, "Existing encryption key found");
            }

            // Cache the encryption key for other native code.
            // Do NOT open MMKV here: Tencent MMKV 1.2 (this JAR) caches instances
            // per-ID in a singleton registry. Opening the file now — before JS has
            // written anything — would cache an empty-state instance. When
            // Ejson.java later reads via the same JAR, it gets that stale cached
            // instance and misses writes made through react-native-mmkv (MMKV 2.0),
            // which has its own separate registry. This manifests as the
            // "No userId found in MMKV for server" failure on first install,
            // resolved only by restarting the app (which clears the cache).
            encryptionKey = password;
            Log.i(TAG, "MMKV encryption key ready");

        } catch (Exception e) {
            Log.e(TAG, "MMKV encryption initialization failed", e);
            // Clear the key on failure to avoid partial state
            encryptionKey = null;
        }
    }

    /**
     * Convert string to hexadecimal (same as react-native-mmkv-storage)
     * 
     * @param arg String to convert
     * @return Hexadecimal representation
     */
    private static String toHex(String arg) {
        try {
            byte[] bytes = arg.getBytes("UTF-8");
            StringBuilder sb = new StringBuilder();
            for (byte b : bytes) {
                sb.append(String.format("%02x", b & 0xff));
            }
            return sb.toString();
        } catch (Exception e) {
            Log.e(TAG, "Error converting string to hex", e);
            return "";
        }
    }
}

