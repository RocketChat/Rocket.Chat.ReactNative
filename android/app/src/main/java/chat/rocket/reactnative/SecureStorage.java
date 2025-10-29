package chat.rocket.reactnative;

import android.content.Context;
import android.content.SharedPreferences;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import android.util.Log;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.util.UUID;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

public class SecureStorage extends ReactContextBaseJavaModule {
    private static final String TAG = "SecureStorage";
    private static final String KEYSTORE_PROVIDER = "AndroidKeyStore";
    private static final String PREFS_NAME = "SecureStoragePrefs";
    private static final String TRANSFORMATION = "AES/GCM/NoPadding";
    private static final int GCM_TAG_LENGTH = 128;

    private final ReactApplicationContext reactContext;

    public SecureStorage(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "SecureStorage";
    }

    @ReactMethod
    public void getSecureKey(String alias, Promise promise) {
        try {
            String value = getSecureKeyInternal(alias);
            promise.resolve(value);
        } catch (Exception e) {
            Log.e(TAG, "Error getting secure key: " + alias, e);
            promise.resolve(null);
        }
    }

    @ReactMethod
    public void setSecureKey(String alias, String value, Promise promise) {
        try {
            setSecureKeyInternal(alias, value);
            promise.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "Error setting secure key: " + alias, e);
            promise.reject("SET_SECURE_KEY_ERROR", e);
        }
    }

    // Internal methods (can be called from Java)
    public String getSecureKeyInternal(String alias) {
        try {
            SharedPreferences prefs = reactContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String encryptedValue = prefs.getString(alias, null);
            
            if (encryptedValue == null) {
                return null;
            }

            // Decrypt the value
            KeyStore keyStore = KeyStore.getInstance(KEYSTORE_PROVIDER);
            keyStore.load(null);

            if (!keyStore.containsAlias(alias)) {
                return null;
            }

            SecretKey secretKey = (SecretKey) keyStore.getKey(alias, null);
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            
            // Split IV and encrypted data
            byte[] combined = Base64.decode(encryptedValue, Base64.DEFAULT);
            byte[] iv = new byte[12];
            byte[] encrypted = new byte[combined.length - 12];
            System.arraycopy(combined, 0, iv, 0, 12);
            System.arraycopy(combined, 12, encrypted, 0, encrypted.length);
            
            GCMParameterSpec spec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, spec);
            
            byte[] decrypted = cipher.doFinal(encrypted);
            return new String(decrypted, StandardCharsets.UTF_8);
        } catch (Exception e) {
            Log.e(TAG, "Error retrieving secure key", e);
            return null;
        }
    }

    public void setSecureKeyInternal(String alias, String value) throws Exception {
        KeyStore keyStore = KeyStore.getInstance(KEYSTORE_PROVIDER);
        keyStore.load(null);

        // Create key if it doesn't exist
        if (!keyStore.containsAlias(alias)) {
            KeyGenerator keyGenerator = KeyGenerator.getInstance(
                KeyProperties.KEY_ALGORITHM_AES, 
                KEYSTORE_PROVIDER
            );
            keyGenerator.init(
                new KeyGenParameterSpec.Builder(
                    alias,
                    KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT
                )
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setRandomizedEncryptionRequired(true)
                .build()
            );
            keyGenerator.generateKey();
        }

        // Encrypt the value
        SecretKey secretKey = (SecretKey) keyStore.getKey(alias, null);
        Cipher cipher = Cipher.getInstance(TRANSFORMATION);
        cipher.init(Cipher.ENCRYPT_MODE, secretKey);
        
        byte[] iv = cipher.getIV();
        byte[] encrypted = cipher.doFinal(value.getBytes(StandardCharsets.UTF_8));
        
        // Combine IV and encrypted data
        byte[] combined = new byte[iv.length + encrypted.length];
        System.arraycopy(iv, 0, combined, 0, iv.length);
        System.arraycopy(encrypted, 0, combined, iv.length, encrypted.length);
        
        String encryptedValue = Base64.encodeToString(combined, Base64.DEFAULT);
        
        // Store in SharedPreferences
        SharedPreferences prefs = reactContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit().putString(alias, encryptedValue).apply();
    }

    // Generate a secure key if it doesn't exist
    public String getOrCreateSecureKey(String alias) {
        String key = getSecureKeyInternal(alias);
        if (key == null) {
            // Generate a new random key
            key = UUID.randomUUID().toString();
            try {
                setSecureKeyInternal(alias, key);
            } catch (Exception e) {
                Log.e(TAG, "Error creating secure key", e);
                return null;
            }
        }
        return key;
    }
}

