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
     * - May misdetect: Integer.MIN_VALUE as non-integer, stored 'false' as missing
     * - These limitations are acceptable for read-only legacy migration
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
