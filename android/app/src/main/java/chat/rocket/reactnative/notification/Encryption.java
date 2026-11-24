package chat.rocket.reactnative.notification;

import androidx.annotation.Keep;
import android.content.Context;
import android.database.Cursor;
import android.util.Base64;
import android.util.Log;

import com.google.gson.Gson;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import chat.rocket.mobilecrypto.AESKey;
import chat.rocket.mobilecrypto.MobileCryptoNative;
import com.nozbe.watermelondb.WMDatabase;

import java.security.PrivateKey;

@Keep
class Message {
    String msg;

    Message(String msg) {
        this.msg = msg;
    }
}

@Keep
class FallbackMessage {
    String _id;
    String userId;
    String text;
    long ts;
}

@Keep
class DecryptedContent {
    String msg;
    String text;

    DecryptedContent(String msg, String text) {
        this.msg = msg;
        this.text = text;
    }
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

class RoomKeyResult {
    AESKey decryptedKey;
    String algorithm;
    
    RoomKeyResult(AESKey decryptedKey, String algorithm) {
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

    private static final String TAG = "RocketChat.E2E";
    
    public static Encryption shared = new Encryption();

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

    public Room readRoom(final Ejson ejson, Context context) {
        String dbName = getDatabaseName(ejson.serverURL(), context);
        WMDatabase db = null;

        try {
           db = WMDatabase.getInstance(dbName, context);
           String[] queryArgs = {ejson.rid};

           Cursor cursor = db.rawQuery("SELECT * FROM subscriptions WHERE id == ? LIMIT 1", queryArgs);

           if (cursor.getCount() == 0) {
               cursor.close();
               return null;
           }

           cursor.moveToFirst();
           int e2eKeyColumnIndex = cursor.getColumnIndex("e2e_key");
           int encryptedColumnIndex = cursor.getColumnIndex("encrypted");
           
           if (e2eKeyColumnIndex == -1) {
               Log.e(TAG, "e2e_key column not found in subscriptions table");
               cursor.close();
               return null;
           }
           
           String e2eKey = cursor.getString(e2eKeyColumnIndex);
           Boolean encrypted = encryptedColumnIndex != -1 && cursor.getInt(encryptedColumnIndex) > 0;
           cursor.close();

           return new Room(e2eKey, encrypted);

        } catch (Exception e) {
            Log.e(TAG, "Error reading room", e);
            return null;

        } finally {
            if (db != null) {
                db.close();
            }
        }
    }

    private String getDatabaseName(String serverUrl, Context context) {
        // Match JS WatermelonDB naming: strip scheme, replace '/' with '.', and append one ".db".
        String name = serverUrl.replaceFirst("^(\\w+:)?//", "").replace("/", ".");
        name += ".db";

        // Important: return just the name (not an absolute path). WMDatabase will resolve and append its own ".db" internally,
        // so the physical file becomes "*.db.db", matching the JS adapter.
        return name;
    }

    public PrivateKey readUserKey(final Ejson ejson) {
        String storedKey = ejson.privateKey();
        if (storedKey == null) {
            return null;
        }

        JsonElement parsedKey = gson.fromJson(storedKey, JsonElement.class);
        if (parsedKey == null || parsedKey.isJsonNull()) {
            return null;
        }

        String jwk = parsedKey.isJsonPrimitive() ? parsedKey.getAsString() : parsedKey.toString();
        return MobileCryptoNative.INSTANCE.rsaImportPrivateKey(jwk);
    }

    public RoomKeyResult decryptRoomKey(final String e2eKey, final Ejson ejson) throws Exception {
        if (e2eKey == null || e2eKey.isEmpty()) {
            return null;
        }
        
        // Parse using prefixed base64
        PrefixedData parsed;
        try {
            parsed = decodePrefixedBase64(e2eKey);
            keyId = parsed.prefix;
        } catch (Exception e) {
            Log.e(TAG, "Failed to decode prefixed base64", e);
            throw e;
        }
        
        // Decrypt the session key
        PrivateKey userKey = readUserKey(ejson);
        if (userKey == null) {
            return null;
        }
        
        String base64EncryptedData = Base64.encodeToString(parsed.data, Base64.NO_WRAP);
        String decrypted = MobileCryptoNative.INSTANCE.rsaDecrypt(base64EncryptedData, userKey);
        if (decrypted == null) {
            Log.e(TAG, "RSA decryption failed");
            return null;
        }
        
        // Parse sessionKey to determine v1 vs v2 from "alg" field
        JsonObject sessionKey;
        try {
            sessionKey = gson.fromJson(decrypted, JsonObject.class);
            if (sessionKey == null) {
                return null;
            }
        } catch (com.google.gson.JsonSyntaxException e) {
            Log.e(TAG, "Failed to parse decrypted session key as JSON", e);
            throw new Exception("Failed to parse decrypted session key as JSON: " + e.getMessage(), e);
        }
        
        if (!sessionKey.has("k")) {
            return null;
        }
        
        AESKey decryptedKey = MobileCryptoNative.INSTANCE.aesImportKey(sessionKey.get("k").getAsString());
        if (decryptedKey == null) {
            Log.e(TAG, "Failed to import room key");
            return null;
        }

        // Determine format from "alg" field
        String algorithm;
        if (sessionKey.has("alg") && "A256GCM".equals(sessionKey.get("alg").getAsString())) {
            algorithm = "rc.v2.aes-sha2";
        } else {
            algorithm = "rc.v1.aes-sha2";
        }
        this.algorithm = algorithm;
        
        return new RoomKeyResult(decryptedKey, algorithm);
    }

    private String decryptContent(Ejson.Content content, AESKey roomKey) {
        String decryptedText = "rc.v2.aes-sha2".equals(content.algorithm)
                ? MobileCryptoNative.INSTANCE.aesGcmDecrypt(content.ciphertext, content.iv, roomKey)
                : MobileCryptoNative.INSTANCE.aesCbcDecrypt(content.ciphertext.substring(12), roomKey);
        if (decryptedText == null) {
            return null;
        }

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

    public String decryptMessage(final Ejson ejson, final Context context) {
        try {
            if (context == null) {
                Log.e(TAG, "Cannot decrypt: context is null");
                return null;
            }
            
            Room room = readRoom(ejson, context);
            if (room == null || room.e2eKey == null) {
                Log.w(TAG, "Cannot decrypt: room or e2eKey not found");
                return null;
            }
            
            RoomKeyResult roomKeyResult = decryptRoomKey(room.e2eKey, ejson);
            if (roomKeyResult == null || roomKeyResult.decryptedKey == null) {
                Log.w(TAG, "Cannot decrypt: room key decryption failed");
                return null;
            }
            
            AESKey e2eKey = roomKeyResult.decryptedKey;
            
            // Try v2 format (content field) first
            if (ejson.content != null && ejson.content.algorithm != null) {
                return decryptContent(ejson.content, e2eKey);
            }
            
            // Fallback to v1 format (msg field)
            if (ejson.msg != null && !ejson.msg.isEmpty()) {
                Ejson.Content fallbackContent = new Ejson.Content();
                fallbackContent.algorithm = "rc.v1.aes-sha2";
                fallbackContent.ciphertext = ejson.msg;
                fallbackContent.kid = null;
                fallbackContent.iv = null;
                return decryptContent(fallbackContent, e2eKey);
            }
            
            Log.w(TAG, "Cannot decrypt: no content or msg field found");
            return null;

        } catch (Exception e) {
            Log.e(TAG, "Decryption failed", e);
            return null;
        }
    }

    public EncryptionContent encryptMessageContent(final String message, final String id, final Ejson ejson, final Context context) {
        try {
            if (context == null) {
                Log.e(TAG, "Cannot encrypt: context is null");
                return null;
            }
            
            Room room = readRoom(ejson, context);
            if (room == null || !room.encrypted || room.e2eKey == null) {
                return null;
            }

            RoomKeyResult roomKeyResult = decryptRoomKey(room.e2eKey, ejson);
            if (roomKeyResult == null || roomKeyResult.decryptedKey == null) {
                return null;
            }
            AESKey e2eKey = roomKeyResult.decryptedKey;

            String cypher = gson.toJson(new Message(message));

            if ("rc.v2.aes-sha2".equals(algorithm)) {
                MobileCryptoNative.EncryptedText encrypted = MobileCryptoNative.INSTANCE.aesGcmEncrypt(cypher, e2eKey);
                if (encrypted == null) {
                    return null;
                }
                return new EncryptionContent(algorithm, encrypted.getCiphertext(), keyId, encrypted.getIv());
            }

            String ivAndCiphertext = MobileCryptoNative.INSTANCE.aesCbcEncrypt(cypher, e2eKey);
            if (ivAndCiphertext == null) {
                return null;
            }
            return new EncryptionContent(algorithm, keyId + ivAndCiphertext);
        } catch (Exception e) {
            Log.e("[ROCKETCHAT][E2E]", Log.getStackTraceString(e));
        }

        return null;
    }
}
