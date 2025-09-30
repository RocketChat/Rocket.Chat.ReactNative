package chat.rocket.reactnative.notification;

import android.database.Cursor;
import android.util.Base64;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.WritableMap;
import com.wix.reactnativenotifications.core.AppLifecycleFacade;
import com.wix.reactnativenotifications.core.AppLifecycleFacadeHolder;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import chat.rocket.mobilecrypto.algorithms.AESCrypto;
import chat.rocket.mobilecrypto.algorithms.RSACrypto;
import chat.rocket.mobilecrypto.algorithms.CryptoUtils;
import com.nozbe.watermelondb.WMDatabase;

import java.lang.reflect.Field;
import java.security.SecureRandom;
import java.util.Arrays;

class Message {
    String msg;

    Message(String msg) {
        this.msg = msg;
    }
}

class FallbackMessage {
    String _id;
    String userId;
    String text;
    long ts;
}

class DecryptedContent {
    String msg;
    String text;

    DecryptedContent(String msg, String text) {
        this.msg = msg;
        this.text = text;
    }
}

class PrivateKey {
    String d;
    String dp;
    String dq;
    String e;
    String n;
    String p;
    String q;
    String qi;
}

class RoomKey {
    String k;
}

class Room {
    String e2eKey;
    Boolean encrypted;

    Room(String e2eKey, Boolean encrypted) {
        this.e2eKey = e2eKey;
        this.encrypted = encrypted;
    }
}

class PrefixedData {
    String prefix;
    byte[] data;
    
    PrefixedData(String prefix, byte[] data) {
        this.prefix = prefix;
        this.data = data;
    }
}

class ParsedMessage {
    String keyId;
    byte[] iv;
    String ciphertext;
    String algorithm;
    
    ParsedMessage(String keyId, byte[] iv, String ciphertext, String algorithm) {
        this.keyId = keyId;
        this.iv = iv;
        this.ciphertext = ciphertext;
        this.algorithm = algorithm;
    }
}

class RoomKeyResult {
    String decryptedKey;
    String algorithm;
    
    RoomKeyResult(String decryptedKey, String algorithm) {
        this.decryptedKey = decryptedKey;
        this.algorithm = algorithm;
    }
}

class Encryption {
    static class EncryptionContent {
        String algorithm;
        String ciphertext;
        String kid;
        String iv;
        
        EncryptionContent(String algorithm, String ciphertext, String kid, String iv) {
            this.algorithm = algorithm;
            this.ciphertext = ciphertext;
            this.kid = kid;
            this.iv = iv;
        }
        
        EncryptionContent(String algorithm, String ciphertext) {
            this.algorithm = algorithm;
            this.ciphertext = ciphertext;
            this.kid = null;
            this.iv = null;
        }
    }
    
    private Gson gson = new Gson();
    private String keyId;
    private String algorithm;

    public static Encryption shared = new Encryption();
    private ReactApplicationContext reactContext;

    private PrefixedData decodePrefixedBase64(String input) {
        // A 256-byte array always encodes to 344 characters in Base64.
        int ENCODED_LENGTH = 344;
        
        if (input.length() < ENCODED_LENGTH) {
            throw new IllegalArgumentException("Invalid input length.");
        }
        
        String prefix = input.substring(0, input.length() - ENCODED_LENGTH);
        String base64Data = input.substring(input.length() - ENCODED_LENGTH);
        byte[] data = Base64.decode(base64Data, Base64.NO_WRAP);
        
        if (data.length != 256) {
            throw new IllegalArgumentException("Invalid decoded length.");
        }
        
        return new PrefixedData(prefix, data);
    }

    private ParsedMessage parseMessage(Ejson.Content content) {
        if ("rc.v2.aes-sha2".equals(content.algorithm)) {
            // V2 format: Extract kid, iv, ciphertext from content
            byte[] iv = Base64.decode(content.iv, Base64.NO_WRAP);
            return new ParsedMessage(content.kid, iv, content.ciphertext, "rc.v2.aes-sha2");
        } else {
            // V1 format: keyID + base64(iv + ciphertext) embedded in ciphertext
            String ciphertext = content.ciphertext;
            String keyId = ciphertext.substring(0, 12);
            String contentBase64 = ciphertext.substring(12);
            byte[] contentBuffer = Base64.decode(contentBase64, Base64.NO_WRAP);
            
            // Split IV (first 16 bytes) and ciphertext (rest)
            byte[] iv = Arrays.copyOfRange(contentBuffer, 0, 16);
            byte[] ciphertextBytes = Arrays.copyOfRange(contentBuffer, 16, contentBuffer.length);
            String ciphertextWithoutPrefix = Base64.encodeToString(ciphertextBytes, Base64.NO_WRAP);
            
            return new ParsedMessage(keyId, iv, ciphertextWithoutPrefix, "rc.v1.aes-sha2");
        }
    }

    public Room readRoom(final Ejson ejson) {
        String dbName = getDatabaseName(ejson.serverURL());
        WMDatabase db = null;

        try {
           db = WMDatabase.getInstance(dbName, reactContext);
           String[] queryArgs = {ejson.rid};

           Cursor cursor = db.rawQuery("SELECT * FROM subscriptions WHERE id == ? LIMIT 1", queryArgs);

           if (cursor.getCount() == 0) {
               cursor.close();
               return null;
           }

           cursor.moveToFirst();
           String e2eKey = cursor.getString(cursor.getColumnIndex("e2e_key"));
           Boolean encrypted = cursor.getInt(cursor.getColumnIndex("encrypted")) > 0;
           cursor.close();

           return new Room(e2eKey, encrypted);

        } catch (Exception e) {
            Log.e("[ENCRYPTION]", "Error reading room", e);
            return null;

        } finally {
            if (db != null) {
                db.close();
            }
        }
    }

    private String getDatabaseName(String serverUrl) {
        int resId = reactContext.getResources().getIdentifier("rn_config_reader_custom_package", "string", reactContext.getPackageName());
        String className = reactContext.getString(resId);
        Boolean isOfficial = false;

        try {
            Class<?> clazz = Class.forName(className + ".BuildConfig");
            Field IS_OFFICIAL = clazz.getField("IS_OFFICIAL");
            isOfficial = (Boolean) IS_OFFICIAL.get(null);
        } catch (Exception e) {
            e.printStackTrace();
        }

        // Match JS WatermelonDB naming: strip scheme, replace '/' with '.', add '-experimental' when needed, and append one ".db".
        String name = serverUrl.replaceFirst("^(\\w+:)?//", "").replace("/", ".");
        if (!isOfficial) {
            name += "-experimental";
        }
        name += ".db";

        // Important: return just the name (not an absolute path). WMDatabase will resolve and append its own ".db" internally,
        // so the physical file becomes "*.db.db", matching the JS adapter.
        return name;
    }

    public String readUserKey(final Ejson ejson) throws Exception {
        String privateKey = ejson.privateKey();
        if (privateKey == null) {
            return null;
        }

        PrivateKey privKey = gson.fromJson(privateKey, PrivateKey.class);

        WritableMap jwk = Arguments.createMap();
        jwk.putString("n", privKey.n);
        jwk.putString("e", privKey.e);
        jwk.putString("d", privKey.d);
        jwk.putString("p", privKey.p);
        jwk.putString("q", privKey.q);
        jwk.putString("dp", privKey.dp);
        jwk.putString("dq", privKey.dq);
        jwk.putString("qi", privKey.qi);

        return RSACrypto.INSTANCE.importJwkKey(jwk);
    }

    public RoomKeyResult decryptRoomKey(final String e2eKey, final Ejson ejson) throws Exception {
        // Parse using prefixed base64
        PrefixedData parsed = decodePrefixedBase64(e2eKey);
        keyId = parsed.prefix;
        
        // Decrypt the session key
        String userKey = readUserKey(ejson);
        if (userKey == null) {
            return null;
        }
        
        String base64EncryptedData = Base64.encodeToString(parsed.data, Base64.NO_WRAP);
        String decrypted = RSACrypto.INSTANCE.decrypt(base64EncryptedData, userKey);
        
        // Parse sessionKey to determine v1 vs v2 from "alg" field
        JsonObject sessionKey = gson.fromJson(decrypted, JsonObject.class);
        String k = sessionKey.get("k").getAsString();
        byte[] decoded = Base64.decode(k, Base64.NO_PADDING | Base64.NO_WRAP | Base64.URL_SAFE);
        String decryptedKey = CryptoUtils.INSTANCE.bytesToHex(decoded);
        
        // Determine format from "alg" field
        if (sessionKey.has("alg") && "A256GCM".equals(sessionKey.get("alg").getAsString())) {
            algorithm = "rc.v2.aes-sha2";
            return new RoomKeyResult(decryptedKey, "rc.v2.aes-sha2");
        } else {
            algorithm = "rc.v1.aes-sha2";
            return new RoomKeyResult(decryptedKey, "rc.v1.aes-sha2");
        }
    }

    private String decryptContent(Ejson.Content content, String e2eKey) throws Exception {
        ParsedMessage parsed = parseMessage(content);
        
        String ivHex = CryptoUtils.INSTANCE.bytesToHex(parsed.iv);
        String decrypted;
        
        if ("rc.v2.aes-sha2".equals(parsed.algorithm)) {
            // Use AES-GCM decryption
            decrypted = AESCrypto.INSTANCE.decryptGcmBase64(parsed.ciphertext, e2eKey, ivHex);
        } else {
            // Use AES-CBC decryption
            decrypted = AESCrypto.INSTANCE.decryptBase64(parsed.ciphertext, e2eKey, ivHex);
        }
        
        byte[] data = Base64.decode(decrypted, Base64.NO_WRAP);
        String decryptedText = new String(data, "UTF-8");
        
        // Try to parse as DecryptedContent first
        try {
            DecryptedContent m = gson.fromJson(decryptedText, DecryptedContent.class);
            return m.msg != null ? m.msg : m.text;
        } catch (Exception e) {
            // Fallback to FallbackMessage format
            FallbackMessage m = gson.fromJson(decryptedText, FallbackMessage.class);
            return m.text;
        }
    }

    public String decryptMessage(final Ejson ejson, final ReactApplicationContext reactContext) {
        try {
            AppLifecycleFacade facade = AppLifecycleFacadeHolder.get();
            if (facade != null && facade.getRunningReactContext() instanceof ReactApplicationContext) {
                this.reactContext = (ReactApplicationContext) facade.getRunningReactContext();
            }

            Room room = readRoom(ejson);
            if (room == null || room.e2eKey == null) {
                return null;
            }
            RoomKeyResult roomKeyResult = decryptRoomKey(room.e2eKey, ejson);
            if (roomKeyResult == null || roomKeyResult.decryptedKey == null) {
                return null;
            }
            String e2eKey = roomKeyResult.decryptedKey;

            if (ejson.content != null && (ejson.content.algorithm != null)) {
                return decryptContent(ejson.content, e2eKey);
            } else if (ejson.msg != null && !ejson.msg.isEmpty()) {
                Ejson.Content fallbackContent = new Ejson.Content();
                fallbackContent.algorithm = "rc.v1.aes-sha2";
                fallbackContent.ciphertext = ejson.msg;
                fallbackContent.kid = null;
                fallbackContent.iv = null;
                return decryptContent(fallbackContent, e2eKey);
            } else {
                return null;
            }

        } catch (Exception e) {
            Log.e("[ROCKETCHAT][E2E]", Log.getStackTraceString(e));
        }

        return null;
    }

    public EncryptionContent encryptMessageContent(final String message, final String id, final Ejson ejson) {
        try {
            AppLifecycleFacade facade = AppLifecycleFacadeHolder.get();
            if (facade != null && facade.getRunningReactContext() instanceof ReactApplicationContext) {
                this.reactContext = (ReactApplicationContext) facade.getRunningReactContext();
            }
            
            Room room = readRoom(ejson);
            if (room == null || !room.encrypted || room.e2eKey == null) {
                return null;
            }

            RoomKeyResult roomKeyResult = decryptRoomKey(room.e2eKey, ejson);
            if (roomKeyResult == null || roomKeyResult.decryptedKey == null) {
                return null;
            }
            String e2eKey = roomKeyResult.decryptedKey;

            Message m = new Message(message);
            String cypher = gson.toJson(m);

            SecureRandom random = new SecureRandom();
            byte[] bytes;
            String encryptedData;
            
            if ("rc.v2.aes-sha2".equals(algorithm)) {
                // V2 format: Use AES-GCM with 12-byte IV
                bytes = new byte[12];
                random.nextBytes(bytes);
                encryptedData = AESCrypto.INSTANCE.encryptGcmBase64(
                    Base64.encodeToString(cypher.getBytes("UTF-8"), Base64.NO_WRAP), 
                    e2eKey, 
                    CryptoUtils.INSTANCE.bytesToHex(bytes)
                );
                
                return new EncryptionContent(
                    algorithm,
                    encryptedData,
                    keyId,
                    Base64.encodeToString(bytes, Base64.NO_WRAP)
                );
            } else {
                // V1 format: Use AES-CBC with 16-byte IV
                bytes = new byte[16];
                random.nextBytes(bytes);
                encryptedData = AESCrypto.INSTANCE.encryptBase64(
                    Base64.encodeToString(cypher.getBytes("UTF-8"), Base64.NO_WRAP), 
                    e2eKey, 
                    CryptoUtils.INSTANCE.bytesToHex(bytes)
                );
                byte[] data = Base64.decode(encryptedData, Base64.NO_WRAP);
                
                // Return full ciphertext for v1
                String fullCiphertext = keyId + Base64.encodeToString(concat(bytes, data), Base64.NO_WRAP);
                return new EncryptionContent(algorithm, fullCiphertext);
            }
        } catch (Exception e) {
            Log.e("[ROCKETCHAT][E2E]", Log.getStackTraceString(e));
        }

        return null;
    }

    static byte[] concat(byte[]... arrays) {
        int totalLength = 0;
        for (byte[] array : arrays) {
            totalLength += array.length;
        }

        byte[] result = new byte[totalLength];
        int currentIndex = 0;

        for (byte[] array : arrays) {
            System.arraycopy(array, 0, result, currentIndex, array.length);
            currentIndex += array.length;
        }

        return result;
    }
}