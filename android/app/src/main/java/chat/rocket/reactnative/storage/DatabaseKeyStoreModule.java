package chat.rocket.reactnative.storage;

import android.content.Context;
import android.content.SharedPreferences;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import android.util.Log;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;

import java.nio.charset.StandardCharsets;
import java.security.KeyStore;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

/**
 * Stores and retrieves per-database SQLCipher keys using Android Keystore AES-GCM.
 *
 * Each storage key maps to an AndroidKeyStore AES entry and a SharedPreferences entry
 * that holds the IV-prefixed ciphertext.  The AES key is never exported; only the
 * encrypted value is written to disk.
 *
 * getItemInternal / setItemInternal / removeItemInternal are intentionally static so
 * Encryption.java can call them without a ReactApplicationContext (same app process,
 * plain Context is enough).
 *
 * SharedPreferences file: "RCDatabaseKeyStore" — separate from MMKV and SecureStoragePrefs
 * so these keys can be found unambiguously from native-only callers.
 */
public class DatabaseKeyStoreModule extends NativeDatabaseKeyStoreSpec {

	private static final String TAG = "RocketChat.DBKeyStore";
	private static final String KEYSTORE_PROVIDER = "AndroidKeyStore";
	private static final String PREFS_NAME = "RCDatabaseKeyStore";
	private static final String TRANSFORMATION = "AES/GCM/NoPadding";
	private static final int GCM_IV_LENGTH = 12;
	private static final int GCM_TAG_LENGTH = 128;

	public DatabaseKeyStoreModule(ReactApplicationContext reactContext) {
		super(reactContext);
	}

	// -------------------------------------------------------------------------
	// JS-facing TurboModule methods
	// -------------------------------------------------------------------------

	@Override
	public void getItem(String key, Promise promise) {
		try {
			promise.resolve(getItemInternal(getReactApplicationContext(), key));
		} catch (Exception e) {
			Log.e(TAG, "getItem failed for key: " + key, e);
			promise.resolve(null);
		}
	}

	@Override
	public void setItem(String key, String value, Promise promise) {
		try {
			setItemInternal(getReactApplicationContext(), key, value);
			promise.resolve(null);
		} catch (Exception e) {
			Log.e(TAG, "setItem failed for key: " + key, e);
			promise.reject("KEYSTORE_WRITE_ERROR", e);
		}
	}

	@Override
	public void removeItem(String key, Promise promise) {
		try {
			removeItemInternal(getReactApplicationContext(), key);
			promise.resolve(null);
		} catch (Exception e) {
			Log.e(TAG, "removeItem failed for key: " + key, e);
			promise.resolve(null);
		}
	}

	// -------------------------------------------------------------------------
	// Native-side helpers — callable from Encryption.java (same process, plain Context)
	// -------------------------------------------------------------------------

	/** Returns the stored plaintext value or null if not found. */
	public static String getItemInternal(Context context, String key) {
		try {
			SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
			String encoded = prefs.getString(key, null);
			if (encoded == null) {
				return null;
			}

			KeyStore ks = KeyStore.getInstance(KEYSTORE_PROVIDER);
			ks.load(null);
			if (!ks.containsAlias(key)) {
				return null;
			}

			SecretKey secretKey = (SecretKey) ks.getKey(key, null);
			byte[] combined = Base64.decode(encoded, Base64.DEFAULT);

			byte[] iv = new byte[GCM_IV_LENGTH];
			byte[] encrypted = new byte[combined.length - GCM_IV_LENGTH];
			System.arraycopy(combined, 0, iv, 0, GCM_IV_LENGTH);
			System.arraycopy(combined, GCM_IV_LENGTH, encrypted, 0, encrypted.length);

			Cipher cipher = Cipher.getInstance(TRANSFORMATION);
			cipher.init(Cipher.DECRYPT_MODE, secretKey, new GCMParameterSpec(GCM_TAG_LENGTH, iv));
			byte[] plain = cipher.doFinal(encrypted);
			return new String(plain, StandardCharsets.UTF_8);
		} catch (Exception e) {
			Log.e(TAG, "getItemInternal failed for key: " + key, e);
			return null;
		}
	}

	/** Stores value under key. Idempotent: the AES Keystore entry is reused if it exists. */
	public static void setItemInternal(Context context, String key, String value) throws Exception {
		KeyStore ks = KeyStore.getInstance(KEYSTORE_PROVIDER);
		ks.load(null);

		// Create the AES-GCM wrapping key once; never export it
		if (!ks.containsAlias(key)) {
			KeyGenerator kg = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, KEYSTORE_PROVIDER);
			kg.init(
				new KeyGenParameterSpec.Builder(key, KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
					.setBlockModes(KeyProperties.BLOCK_MODE_GCM)
					.setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
					.setUserAuthenticationRequired(false)
					.setRandomizedEncryptionRequired(true)
					.build()
			);
			kg.generateKey();
		}

		SecretKey secretKey = (SecretKey) ks.getKey(key, null);
		Cipher cipher = Cipher.getInstance(TRANSFORMATION);
		cipher.init(Cipher.ENCRYPT_MODE, secretKey);

		byte[] iv = cipher.getIV();
		byte[] encrypted = cipher.doFinal(value.getBytes(StandardCharsets.UTF_8));

		// Prepend IV to ciphertext; single Base64 blob stored in SharedPreferences
		byte[] combined = new byte[iv.length + encrypted.length];
		System.arraycopy(iv, 0, combined, 0, iv.length);
		System.arraycopy(encrypted, 0, combined, iv.length, encrypted.length);

		SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
		prefs.edit().putString(key, Base64.encodeToString(combined, Base64.DEFAULT)).apply();
	}

	/** Removes the SharedPreferences entry. Does not delete the AndroidKeyStore key. */
	public static void removeItemInternal(Context context, String key) {
		SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
		prefs.edit().remove(key).apply();
	}
}
