package chat.rocket.reactnative.storage;

/**
 * Constants for SecureKeystore
 * Copied from react-native-mmkv-storage to avoid dependency
 */
public class Constants {

    // Key Store
    public static final String KEYSTORE_PROVIDER_1 = "AndroidKeyStore";
    public static final String KEYSTORE_PROVIDER_2 = "AndroidKeyStoreBCWorkaround";
    public static final String KEYSTORE_PROVIDER_3 = "AndroidOpenSSL";

    public static final String RSA_ALGORITHM = "RSA/ECB/PKCS1Padding";
    public static final String AES_ALGORITHM = "AES/ECB/PKCS5Padding";

    public static final String TAG = "MMKVReaderSecureStorage";

    // Internal storage file
    public static final String SKS_KEY_FILENAME = "SKS_KEY_FILE";
    public static final String SKS_DATA_FILENAME = "SKS_DATA_FILE";

    public static final int DATA_TYPE_STRING = 1;
    public static final int DATA_TYPE_INT = 2;
    public static final int DATA_TYPE_BOOL = 3;
    public static final int DATA_TYPE_MAP = 4;
    public static final int DATA_TYPE_ARRAY = 5;
}

