package chat.rocket.reactnative.storage;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;

import com.tencent.mmkv.MMKV;

/**
 * MMKV Migration - Migrates data from react-native-mmkv-storage to react-native-mmkv
 * Runs synchronously at app startup before React Native initializes
 */
public class MMKVMigration {
    private static final String TAG = "MMKVMigration";
    private static final String MIGRATION_FLAG_KEY = "MMKV_MIGRATION_COMPLETED";
    private static final String DEFAULT_INSTANCE_ID = "default";

    /**
     * Migrates MMKV data from old encrypted storage to new unencrypted storage
     * Only runs once - checks SharedPreferences flag before migrating
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

            // Open old MMKV instance with the encryption key
            // If password is null, MMKV will open without encryption
            MMKV oldMMKV = MMKV.mmkvWithID(DEFAULT_INSTANCE_ID, MMKV.SINGLE_PROCESS_MODE, password);

            if (oldMMKV == null) {
                Log.i(TAG, "No old MMKV instance found, marking migration as completed");
                prefs.edit().putBoolean(MIGRATION_FLAG_KEY, true).apply();
                return;
            }

            // Get all keys from old MMKV
            String[] allKeys = oldMMKV.allKeys();

            if (allKeys == null || allKeys.length == 0) {
                Log.i(TAG, "No data to migrate");
                prefs.edit().putBoolean(MIGRATION_FLAG_KEY, true).apply();
                return;
            }

            Log.i(TAG, "Found " + allKeys.length + " keys to migrate");

            // Create new unencrypted MMKV instance
            MMKV newMMKV = MMKV.mmkvWithID(DEFAULT_INSTANCE_ID, MMKV.SINGLE_PROCESS_MODE);

            if (newMMKV == null) {
                Log.e(TAG, "Failed to create new MMKV instance");
                return;
            }

            // Migrate all key-value pairs
            int migratedCount = 0;
            int errorCount = 0;

            for (String key : allKeys) {
                try {
                    // Try string first (most common in React Native storage)
                    String stringValue = oldMMKV.decodeString(key);
                    if (stringValue != null) {
                        newMMKV.encodeString(key, stringValue);
                        migratedCount++;
                        continue;
                    }

                    // Try int (with sentinel value)
                    int intValue = oldMMKV.decodeInt(key, Integer.MIN_VALUE);
                    if (intValue != Integer.MIN_VALUE) {
                        newMMKV.encodeInt(key, intValue);
                        migratedCount++;
                        continue;
                    }

                    // Try boolean (if key exists but not string/int, assume boolean)
                    if (oldMMKV.containsKey(key)) {
                        boolean boolValue = oldMMKV.decodeBool(key, false);
                        newMMKV.encodeBool(key, boolValue);
                        migratedCount++;
                    }
                } catch (Exception e) {
                    errorCount++;
                    Log.e(TAG, "Error migrating key: " + key, e);
                }
            }

            Log.i(TAG, "Migration complete: " + migratedCount + " keys migrated, " + errorCount + " errors");

            // Only mark as completed if migration succeeded (no critical errors)
            // If some keys failed, we still mark as completed to avoid retrying forever
            // Individual key errors are logged but don't block migration
            prefs.edit().putBoolean(MIGRATION_FLAG_KEY, true).apply();
            Log.i(TAG, "MMKV migration completed successfully");

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

