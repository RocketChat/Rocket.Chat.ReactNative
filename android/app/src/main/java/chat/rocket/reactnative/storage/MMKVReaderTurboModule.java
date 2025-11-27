package chat.rocket.reactnative.storage;

import java.io.File;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.Arguments;
import com.tencent.mmkv.MMKV;

// Reads and decrypts old MMKV storage using Tencent MMKV library

public class MMKVReaderTurboModule extends NativeMMKVReaderSpec {

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

            promise.resolve(result);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    @Override
    public void listMMKVFiles(Promise promise) {
        try {
            File filesDir = reactContext.getFilesDir();
            File mmkvDir = new File(filesDir, "mmkv");
            
            WritableArray filesList = Arguments.createArray();
            
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
                    }
                }
            }

            promise.resolve(filesList);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    /**
     * Reads and decrypts legacy MMKV storage for one-time migration.
     * 
     * LIMITATIONS (inherent to MMKV Java API v1.2.10):
     * - No API to query stored value types before decoding
     * - Uses sentinel values and heuristics for type detection
     * 
     * TYPE DETECTION LIMITATIONS:
     * 1. Integer.MIN_VALUE sentinel: Actual stored values of Integer.MIN_VALUE cannot be
     *    distinguished from "key not found", so they will be skipped during migration.
     *    This is acceptable for one-time migration as Integer.MIN_VALUE is rarely used.
     * 
     * 2. Boolean false detection: Boolean values stored as 'false' may be misdetected
     *    if the key exists but decodeBool() returns false (which could mean either
     *    "stored false" or "not found, returning default"). The current implementation
     *    uses containsKey() check, but this is not 100% reliable for boolean detection.
     * 
     * 3. Type inference order: String → Int → Boolean. If a value could be multiple types,
     *    it will be detected as the first matching type in this order.
     * 
     * These limitations are acceptable for read-only legacy migration. The native
     * MMKVMigration class uses the same approach. Critical data should be verified
     * post-migration if Integer.MIN_VALUE or boolean false values are expected.
     * 
     * @param mmkvId The MMKV instance ID to read
     * @param promise React Native promise for async result
     */
    @Override
    public void readAndDecryptMMKV(String mmkvId, Promise promise) {
        try {
            // Initialize MMKV
            MMKV.initialize(reactContext);
            
            // Get the encryption key from SecureKeystore
            SecureKeystore secureKeystore = new SecureKeystore(reactContext);
            String alias = toHex("com.MMKV." + mmkvId);
            String password = secureKeystore.getSecureKey(alias);
            
            // Open MMKV instance with the encryption key
            // If password is null, MMKV will open without encryption
            MMKV mmkv = MMKV.mmkvWithID(mmkvId, MMKV.SINGLE_PROCESS_MODE, password);
            
            if (mmkv == null) {
                promise.reject("NO_MMKV", "Could not open MMKV instance: " + mmkvId);
                return;
            }
            
            // Get all keys from MMKV
            String[] allKeys = mmkv.allKeys();
            
            if (allKeys == null || allKeys.length == 0) {
                promise.resolve(Arguments.createMap());
                return;
            }
            
            // Read all key-value pairs using MMKV's native methods
            WritableMap result = Arguments.createMap();
            
            for (String key : allKeys) {
                try {
                    // Try string first (most common in React Native storage)
                    String stringValue = mmkv.decodeString(key);
                    if (stringValue != null) {
                        result.putString(key, stringValue);
                        continue;
                    }
                    
                    int intValue = mmkv.decodeInt(key, Integer.MIN_VALUE);
                    if (intValue != Integer.MIN_VALUE) {
                        result.putInt(key, intValue);
                        continue;
                    }
                    
                    if (mmkv.containsKey(key)) {
                        boolean boolValue = mmkv.decodeBool(key, false);
                        result.putBoolean(key, boolValue);
                    } 
                } catch (Exception e) {
                    android.util.Log.e("MMKVReader", "Error decoding key: " + key, e);
                }
            }

            promise.resolve(result);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    
    // Convert string to hexadecimal (same as react-native-mmkv-storage)
    
    private String toHex(String arg) {
        try {
            byte[] bytes = arg.getBytes("UTF-8");
            StringBuilder sb = new StringBuilder();
            for (byte b : bytes) {
                sb.append(String.format("%02x", b & 0xff));
            }
            return sb.toString();
        } catch (Exception e) {
            return "";
        }
    }
}
