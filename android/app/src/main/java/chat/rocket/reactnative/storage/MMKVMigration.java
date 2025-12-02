package chat.rocket.reactnative.storage;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;

import com.tencent.mmkv.MMKV;

/**
 * MMKV Migration - Migrates data from react-native-mmkv-storage to react-native-mmkv
 * 
 * The old library (react-native-mmkv-storage) used encryption by default.
 * The new library (react-native-mmkv) will be used without encryption.
 * 
 * This migration uses MMKV's reKey() method to remove encryption in-place,
 * which is simpler and more reliable than copying data between instances.
 * 
 * Runs synchronously at app startup before React Native initializes.
 */
public class MMKVMigration {
    private static final String TAG = "MMKVMigration";
    private static final String MIGRATION_FLAG_KEY = "MMKV_MIGRATION_COMPLETED";
    private static final String DEFAULT_INSTANCE_ID = "default";

    /**
     * Removes encryption from MMKV storage using reKey().
     * Only runs once - checks SharedPreferences flag before migrating.
     * 
     * @param context Application context
     */
    public static void migrate(Context context) {
        try {
            // Check if migration already completed
            SharedPreferences prefs = context.getSharedPreferences("MMKVMigration", Context.MODE_PRIVATE);
            if (prefs.getBoolean(MIGRATION_FLAG_KEY, false)) {
                Log.i(TAG, "MMKV migration already completed, skipping");
                return;
            }

            Log.i(TAG, "Starting MMKV migration...");

            // Initialize MMKV
            MMKV.initialize(context);

            // Get the encryption key from SecureKeystore
            SecureKeystore secureKeystore = new SecureKeystore(context);
            String alias = toHex("com.MMKV." + DEFAULT_INSTANCE_ID);
            String password = secureKeystore.getSecureKey(alias);

            if (password == null || password.isEmpty()) {
                // No encryption was used, nothing to migrate
                Log.i(TAG, "No encryption key found, marking migration as completed");
                prefs.edit().putBoolean(MIGRATION_FLAG_KEY, true).apply();
                return;
            }

            // Open MMKV instance with the encryption key
            MMKV mmkv = MMKV.mmkvWithID(DEFAULT_INSTANCE_ID, MMKV.SINGLE_PROCESS_MODE, password);

            if (mmkv == null) {
                Log.i(TAG, "No MMKV instance found, marking migration as completed");
                prefs.edit().putBoolean(MIGRATION_FLAG_KEY, true).apply();
                return;
            }

            long keyCount = mmkv.count();
            if (keyCount == 0) {
                Log.i(TAG, "No data to migrate");
                prefs.edit().putBoolean(MIGRATION_FLAG_KEY, true).apply();
                return;
            }

            Log.i(TAG, "Found " + keyCount + " keys, removing encryption...");

            // Remove encryption by re-keying to empty string
            // This decrypts all data and rewrites the file without encryption
            boolean success = mmkv.reKey("");

            if (success) {
                // Remove encryption key from SecureKeystore
                secureKeystore.removeSecureKey(alias);
                
                Log.i(TAG, "MMKV encryption removed successfully for " + keyCount + " keys");
                prefs.edit().putBoolean(MIGRATION_FLAG_KEY, true).apply();
            } else {
                Log.e(TAG, "reKey failed - will retry on next launch");
            }

        } catch (Exception e) {
            Log.e(TAG, "MMKV migration failed", e);
            // Don't set flag on failure - will retry on next launch
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
