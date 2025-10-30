package chat.rocket.reactnative.storage;

import android.util.Log;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.Arguments;
import com.tencent.mmkv.MMKV;

import java.io.File;

/**
 * MMKVReader TurboModule
 * Reads and decrypts old MMKV storage using Tencent MMKV library
 * Standalone - doesn't depend on react-native-mmkv-storage
 */
public class MMKVReaderTurboModule extends NativeMMKVReaderSpec {

    private static final String TAG = "MMKVReader";
    private ReactApplicationContext reactContext;

    public MMKVReaderTurboModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return NativeMMKVReaderSpec.NAME;
    }

    @Override
    public void getStoragePath(Promise promise) {
        try {
            File filesDir = reactContext.getFilesDir();
            File mmkvDir = new File(filesDir, "mmkv");
            
            WritableMap result = Arguments.createMap();
            result.putString("filesDir", filesDir.getAbsolutePath());
            result.putString("mmkvDir", mmkvDir.getAbsolutePath());
            result.putBoolean("mmkvDirExists", mmkvDir.exists());
            
            Log.d(TAG, "Files Directory: " + filesDir.getAbsolutePath());
            Log.d(TAG, "MMKV Directory: " + mmkvDir.getAbsolutePath());
            Log.d(TAG, "MMKV Directory exists: " + mmkvDir.exists());
            
            promise.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Error getting storage path", e);
            promise.reject("ERROR", e.getMessage());
        }
    }

    @Override
    public void listMMKVFiles(Promise promise) {
        try {
            File filesDir = reactContext.getFilesDir();
            File mmkvDir = new File(filesDir, "mmkv");
            
            WritableArray filesList = Arguments.createArray();
            
            Log.d(TAG, "=== MMKV Files List ===");
            Log.d(TAG, "Looking in: " + mmkvDir.getAbsolutePath());
            
            if (mmkvDir.exists() && mmkvDir.isDirectory()) {
                File[] files = mmkvDir.listFiles();
                if (files != null) {
                    for (File file : files) {
                        WritableMap fileInfo = Arguments.createMap();
                        fileInfo.putString("name", file.getName());
                        fileInfo.putString("path", file.getAbsolutePath());
                        fileInfo.putDouble("size", file.length());
                        fileInfo.putBoolean("isFile", file.isFile());
                        filesList.pushMap(fileInfo);
                        
                        Log.d(TAG, "File: " + file.getName() + " (" + file.length() + " bytes)");
                    }
                } else {
                    Log.d(TAG, "Directory is empty or cannot read files");
                }
            } else {
                Log.d(TAG, "MMKV directory does not exist");
            }
            
            Log.d(TAG, "======================");
            
            promise.resolve(filesList);
        } catch (Exception e) {
            Log.e(TAG, "Error listing MMKV files", e);
            promise.reject("ERROR", e.getMessage());
        }
    }

    @Override
    public void readAndDecryptMMKV(String mmkvId, Promise promise) {
        try {
            Log.d(TAG, "=== Starting MMKV Read (Using Tencent MMKV Library) ===");
            Log.d(TAG, "MMKV ID: " + mmkvId);
            
            // Initialize MMKV
            MMKV.initialize(reactContext);
            Log.d(TAG, "MMKV initialized");
            
            // Get the encryption key from SecureKeystore
            SecureKeystore secureKeystore = new SecureKeystore(reactContext);
            String alias = toHex("com.MMKV." + mmkvId);
            String password = secureKeystore.getSecureKey(alias);
            
            Log.d(TAG, "Alias (hex): " + alias);
            Log.d(TAG, "Encryption key retrieved: " + (password != null ? "YES (length: " + password.length() + ")" : "NO"));
            
            // Open MMKV instance with the encryption key
            // If password is null, MMKV will open without encryption
            MMKV mmkv = MMKV.mmkvWithID(mmkvId, MMKV.SINGLE_PROCESS_MODE, password);
            
            if (mmkv == null) {
                Log.e(TAG, "Failed to open MMKV instance");
                promise.reject("NO_MMKV", "Could not open MMKV instance: " + mmkvId);
                return;
            }
            
            Log.d(TAG, "✅ MMKV instance opened successfully");
            
            // Get all keys from MMKV
            String[] allKeys = mmkv.allKeys();
            
            if (allKeys == null || allKeys.length == 0) {
                Log.d(TAG, "⚠️  No keys found in MMKV instance");
                promise.resolve(Arguments.createMap());
                return;
            }
            
            Log.d(TAG, "📋 Total keys found: " + allKeys.length);
            Log.d(TAG, "");
            Log.d(TAG, "=== All MMKV Key-Value Pairs ===");
            
            // Read all key-value pairs using MMKV's native methods
            WritableMap result = Arguments.createMap();
            int stringCount = 0;
            int intCount = 0;
            int boolCount = 0;
            
            for (String key : allKeys) {
                try {
                    // Try to read as string first (most common)
                    String value = mmkv.decodeString(key);
                    
                    if (value != null) {
                        result.putString(key, value);
                        stringCount++;
                        
                        // Log with truncation for long values
                        String displayValue = value.length() > 100 
                            ? value.substring(0, 100) + "... (+" + (value.length() - 100) + " more chars)" 
                            : value;
                        
                        Log.d(TAG, "📝 String Key: " + key);
                        Log.d(TAG, "   Value: " + displayValue);
                        Log.d(TAG, "");
                    } else {
                        // Try as int
                        int intValue = mmkv.decodeInt(key, Integer.MIN_VALUE);
                        if (intValue != Integer.MIN_VALUE) {
                            result.putInt(key, intValue);
                            intCount++;
                            Log.d(TAG, "🔢 Int Key: " + key + " = " + intValue);
                            Log.d(TAG, "");
                        } else {
                            // Try as boolean
                            boolean boolValue = mmkv.decodeBool(key, false);
                            result.putBoolean(key, boolValue);
                            boolCount++;
                            Log.d(TAG, "✓ Bool Key: " + key + " = " + boolValue);
                            Log.d(TAG, "");
                        }
                    }
                } catch (Exception e) {
                    Log.e(TAG, "❌ Error reading key: " + key, e);
                }
            }
            
            Log.d(TAG, "=== MMKV Read Complete ===");
            Log.d(TAG, "Successfully read " + allKeys.length + " keys:");
            Log.d(TAG, "  - Strings: " + stringCount);
            Log.d(TAG, "  - Integers: " + intCount);
            Log.d(TAG, "  - Booleans: " + boolCount);
            Log.d(TAG, "");
            
            promise.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Error reading MMKV", e);
            Log.e(TAG, "Stack trace: " + Log.getStackTraceString(e));
            promise.reject("ERROR", e.getMessage());
        }
    }

    /**
     * Convert string to hexadecimal (same as react-native-mmkv-storage)
     */
    private String toHex(String arg) {
        try {
            byte[] bytes = arg.getBytes("UTF-8");
            StringBuilder sb = new StringBuilder();
            for (byte b : bytes) {
                sb.append(String.format("%x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            Log.e(TAG, "Error converting to hex", e);
            return "";
        }
    }
}
