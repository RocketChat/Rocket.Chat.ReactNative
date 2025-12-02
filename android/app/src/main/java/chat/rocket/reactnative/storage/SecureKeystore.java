package chat.rocket.reactnative.storage;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Build;
import android.security.KeyPairGeneratorSpec;
import android.util.Log;

import androidx.security.crypto.EncryptedSharedPreferences;
import androidx.security.crypto.MasterKey;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.IllegalViewOperationException;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.math.BigInteger;
import java.security.GeneralSecurityException;
import java.security.KeyPairGenerator;
import java.security.KeyStore;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Locale;

import javax.crypto.Cipher;
import javax.crypto.CipherInputStream;
import javax.crypto.CipherOutputStream;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import javax.security.auth.x500.X500Principal;

/**
 * SecureKeystore implementation
 * Copied from react-native-mmkv-storage to avoid dependency
 * Original source: https://github.com/ammarahm-ed/react-native-mmkv-storage/blob/master/android/src/main/java/com/ammarahmed/mmkv/SecureKeystore.java
 * This manages encryption keys using Android Keystore System
 */
public class SecureKeystore {

    private SharedPreferences prefs;
    private Context context;
    private final String SharedPrefFileName = "rnmmkv.shareprefs";

    private boolean useKeystore() {
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.M;
    }

    public SecureKeystore(ReactApplicationContext reactApplicationContext) {
        context = reactApplicationContext;
        if (!useKeystore()) {
            try {
                MasterKey key = new MasterKey.Builder(context)
                        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                        .build();

                // Filename for EncryptedSharedPreferences - must match react-native-mmkv-storage
                // to maintain compatibility with existing encrypted preference files
                // This hash was used by the original library and cannot be changed
                prefs = EncryptedSharedPreferences.create(
                        context,
                        "e4b001df9a082298dd090bb7455c45d92fbd5dda.xml",
                        key,
                        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM);
            } catch (GeneralSecurityException | IOException | RuntimeException e) {
                Log.e("SecureKeystore", "Failed to create encrypted shared preferences! Falling back to standard SharedPreferences", e);
                prefs = context.getSharedPreferences(SharedPrefFileName, Context.MODE_PRIVATE);
            }
        }
    }

    public SecureKeystore(Context context) {
        this.context = context;
        if (!useKeystore()) {
            try {
                MasterKey key = new MasterKey.Builder(context)
                        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                        .build();

                // Filename for EncryptedSharedPreferences - must match react-native-mmkv-storage
                // to maintain compatibility with existing encrypted preference files
                // This hash was used by the original library and cannot be changed
                prefs = EncryptedSharedPreferences.create(
                        context,
                        "e4b001df9a082298dd090bb7455c45d92fbd5dda.xml",
                        key,
                        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM);
            } catch (GeneralSecurityException | IOException | RuntimeException e) {
                Log.e("SecureKeystore", "Failed to create encrypted shared preferences! Falling back to standard SharedPreferences", e);
                prefs = context.getSharedPreferences(SharedPrefFileName, Context.MODE_PRIVATE);
            }
        }
    }

    public static boolean isRTL(Locale locale) {
        final int directionality = Character.getDirectionality(locale.getDisplayName().charAt(0));
        return directionality == Character.DIRECTIONALITY_RIGHT_TO_LEFT ||
                directionality == Character.DIRECTIONALITY_RIGHT_TO_LEFT_ARABIC;
    }

    public void setSecureKey(String key, String value) {
        if (useKeystore()) {
            try {
                Locale initialLocale = Locale.getDefault();
                if (isRTL(initialLocale)) {
                    Locale.setDefault(Locale.ENGLISH);
                    setCipherText(context, key, value);
                    Locale.setDefault(initialLocale);
                } else {
                    setCipherText(context, key, value);
                }
            } catch (Exception e) {
                Log.e(Constants.TAG, "Error setting secure key", e);
            }
        } else {
            try {
                SharedPreferences.Editor editor = prefs.edit();
                editor.putString(key, value);
                editor.apply();
            } catch (Exception e) {
                Log.e(Constants.TAG, "Error setting key in prefs", e);
            }
        }
    }

    public String getSecureKey(String key) {
        if (useKeystore()) {
            try {
                String value = getPlainText(context, key);
                return value;
            } catch (FileNotFoundException fnfe) {
                return null;
            } catch (Exception e) {
                Log.e(Constants.TAG, "Error getting secure key", e);
                return null;
            }
        } else {
            try {
                String value = prefs.getString(key, null);
                return value;
            } catch (IllegalViewOperationException e) {
                return null;
            }
        }
    }

    public boolean removeSecureKey(String key) {
        if (useKeystore()) {
            try {
                // Delete the cipher text file
                String filename = Constants.SKS_DATA_FILENAME + key;
                boolean deleted = context.deleteFile(filename);
                Log.i(Constants.TAG, "Removed secure key file: " + deleted);
                return deleted;
            } catch (Exception e) {
                Log.e(Constants.TAG, "Error removing secure key", e);
                return false;
            }
        } else {
            try {
                SharedPreferences.Editor editor = prefs.edit();
                editor.remove(key);
                editor.apply();
                Log.i(Constants.TAG, "Removed secure key from prefs");
                return true;
            } catch (Exception e) {
                Log.e(Constants.TAG, "Error removing key from prefs", e);
                return false;
            }
        }
    }

    private PublicKey getOrCreatePublicKey(Context context, String alias) throws GeneralSecurityException, IOException {
        KeyStore keyStore = KeyStore.getInstance(getKeyStore());
        keyStore.load(null);

        if (!keyStore.containsAlias(alias) || keyStore.getCertificate(alias) == null) {
            Log.i(Constants.TAG, "no existing asymmetric keys for alias");

            Calendar start = Calendar.getInstance();
            Calendar end = Calendar.getInstance();
            end.add(Calendar.YEAR, 50);
            KeyPairGeneratorSpec spec = new KeyPairGeneratorSpec.Builder(context)
                    .setAlias(alias)
                    .setSubject(new X500Principal("CN=" + alias))
                    .setSerialNumber(BigInteger.ONE)
                    .setStartDate(start.getTime())
                    .setEndDate(end.getTime())
                    .build();

            KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA", getKeyStore());
            generator.initialize(spec);
            generator.generateKeyPair();

            Log.i(Constants.TAG, "created new asymmetric keys for alias");
        }

        return keyStore.getCertificate(alias).getPublicKey();
    }

    private byte[] encryptRsaPlainText(PublicKey publicKey, byte[] plainTextBytes) throws GeneralSecurityException, IOException {
        Cipher cipher = Cipher.getInstance(Constants.RSA_ALGORITHM);
        cipher.init(Cipher.ENCRYPT_MODE, publicKey);
        return encryptCipherText(cipher, plainTextBytes);
    }

    private byte[] encryptAesPlainText(SecretKey secretKey, String plainText) throws GeneralSecurityException, IOException {
        Cipher cipher = Cipher.getInstance(Constants.AES_ALGORITHM);
        cipher.init(Cipher.ENCRYPT_MODE, secretKey);
        return encryptCipherText(cipher, plainText);
    }

    private byte[] encryptCipherText(Cipher cipher, String plainText) throws GeneralSecurityException, IOException {
        return encryptCipherText(cipher, plainText.getBytes("UTF-8"));
    }

    private byte[] encryptCipherText(Cipher cipher, byte[] plainTextBytes) throws GeneralSecurityException, IOException {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        CipherOutputStream cipherOutputStream = new CipherOutputStream(outputStream, cipher);
        cipherOutputStream.write(plainTextBytes);
        cipherOutputStream.close();
        return outputStream.toByteArray();
    }

    private SecretKey getOrCreateSecretKey(Context context, String alias) throws GeneralSecurityException, IOException {
        try {
            return getSymmetricKey(context, alias);
        } catch (FileNotFoundException fnfe) {
            Log.i(Constants.TAG, "no existing symmetric key for alias");

            KeyGenerator keyGenerator = KeyGenerator.getInstance("AES");
            //32bytes / 256bits AES key
            keyGenerator.init(256);
            SecretKey secretKey = keyGenerator.generateKey();
            PublicKey publicKey = getOrCreatePublicKey(context, alias);
            Storage.writeValues(context, Constants.SKS_KEY_FILENAME + alias,
                    encryptRsaPlainText(publicKey, secretKey.getEncoded()));

            Log.i(Constants.TAG, "created new symmetric keys for alias");
            return secretKey;
        }
    }

    public void setCipherText(Context context, String alias, String input) throws GeneralSecurityException, IOException {
        Storage.writeValues(context, Constants.SKS_DATA_FILENAME + alias,
                encryptAesPlainText(getOrCreateSecretKey(context, alias), input));
    }

    private PrivateKey getPrivateKey(String alias) throws GeneralSecurityException, IOException {
        KeyStore keyStore = KeyStore.getInstance(getKeyStore());
        keyStore.load(null);
        return (PrivateKey) keyStore.getKey(alias, null);
    }

    private byte[] decryptRsaCipherText(PrivateKey privateKey, byte[] cipherTextBytes) throws GeneralSecurityException, IOException {
        Cipher cipher = Cipher.getInstance(Constants.RSA_ALGORITHM);
        cipher.init(Cipher.DECRYPT_MODE, privateKey);
        return decryptCipherText(cipher, cipherTextBytes);
    }

    private byte[] decryptAesCipherText(SecretKey secretKey, byte[] cipherTextBytes) throws GeneralSecurityException, IOException {
        Cipher cipher = Cipher.getInstance(Constants.AES_ALGORITHM);
        cipher.init(Cipher.DECRYPT_MODE, secretKey);
        return decryptCipherText(cipher, cipherTextBytes);
    }

    private byte[] decryptCipherText(Cipher cipher, byte[] cipherTextBytes) throws IOException {
        ByteArrayInputStream bais = new ByteArrayInputStream(cipherTextBytes);
        CipherInputStream cipherInputStream = new CipherInputStream(bais, cipher);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        byte[] buffer = new byte[256];
        int bytesRead = cipherInputStream.read(buffer);
        while (bytesRead != -1) {
            baos.write(buffer, 0, bytesRead);
            bytesRead = cipherInputStream.read(buffer);
        }
        return baos.toByteArray();
    }

    private SecretKey getSymmetricKey(Context context, String alias) throws GeneralSecurityException, IOException {
        byte[] cipherTextBytes = Storage.readValues(context, Constants.SKS_KEY_FILENAME + alias);
        return new SecretKeySpec(decryptRsaCipherText(getPrivateKey(alias), cipherTextBytes), Constants.AES_ALGORITHM);
    }

    public String getPlainText(Context context, String alias) throws GeneralSecurityException, IOException {
        SecretKey secretKey = getSymmetricKey(context, alias);
        byte[] cipherTextBytes = Storage.readValues(context, Constants.SKS_DATA_FILENAME + alias);
        return new String(decryptAesCipherText(secretKey, cipherTextBytes), "UTF-8");
    }

    private String getKeyStore() {
        try {
            KeyStore.getInstance(Constants.KEYSTORE_PROVIDER_1);
            return Constants.KEYSTORE_PROVIDER_1;
        } catch (Exception err) {
            try {
                KeyStore.getInstance(Constants.KEYSTORE_PROVIDER_2);
                return Constants.KEYSTORE_PROVIDER_2;
            } catch (Exception e) {
                return Constants.KEYSTORE_PROVIDER_3;
            }
        }
    }
}

