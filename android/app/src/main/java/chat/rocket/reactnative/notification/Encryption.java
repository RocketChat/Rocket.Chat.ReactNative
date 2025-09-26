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
    String _id;
    String userId;
    String text;

    Message(String id, String userId, String text) {
        this._id = id;
        this.userId = userId;
        this.text = text;
    }
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
    boolean isV2;
    
    ParsedMessage(String keyId, byte[] iv, String ciphertext, boolean isV2) {
        this.keyId = keyId;
        this.iv = iv;
        this.ciphertext = ciphertext;
        this.isV2 = isV2;
    }
}

class RoomKeyResult {
    String decryptedKey;
    String version;
    String keyId;
    
    RoomKeyResult(String decryptedKey, String version, String keyId) {
        this.decryptedKey = decryptedKey;
        this.version = version;
        this.keyId = keyId;
    }
}

class Encryption {
    private Gson gson = new Gson();
    private String keyId;

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

    private ParsedMessage parseMessage(String payload) {
        if (payload.startsWith("{")) {
            // V2 format: JSON with kid, iv, ciphertext
            JsonObject parsed = gson.fromJson(payload, JsonObject.class);
            String keyId = parsed.get("kid").getAsString();
            String ivBase64 = parsed.get("iv").getAsString();
            String ciphertext = parsed.get("ciphertext").getAsString();
            
            byte[] iv = Base64.decode(ivBase64, Base64.NO_WRAP);
            
            return new ParsedMessage(keyId, iv, ciphertext, true);
        } else {
            // V1 format: keyID + base64(iv + ciphertext)
            String keyId = payload.substring(0, 12);
            String contentBase64 = payload.substring(12);
            byte[] contentBuffer = Base64.decode(contentBase64, Base64.NO_WRAP);
            
            // Split IV (first 16 bytes) and ciphertext (rest)
            byte[] iv = Arrays.copyOfRange(contentBuffer, 0, 16);
            byte[] ciphertextBytes = Arrays.copyOfRange(contentBuffer, 16, contentBuffer.length);
            String ciphertext = Base64.encodeToString(ciphertextBytes, Base64.NO_WRAP);
            
            return new ParsedMessage(keyId, iv, ciphertext, false);
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
        String keyIdPrefix = parsed.prefix;
        
        // Decrypt the session key
        String userKey = readUserKey(ejson);
        if (userKey == null) {
            return null;
        }
        
        String base64EncryptedData = Base64.encodeToString(parsed.data, Base64.NO_WRAP);
        String decrypted = RSACrypto.INSTANCE.decrypt(base64EncryptedData, userKey);
        
        // Parse to determine v1 vs v2 format
        JsonObject sessionKey = gson.fromJson(decrypted, JsonObject.class);
        
        if (sessionKey.has("kid") && sessionKey.has("sessionKeyExported")) {
            // V2 format
            keyId = sessionKey.get("kid").getAsString();
            JsonObject sessionKeyExported = sessionKey.getAsJsonObject("sessionKeyExported");
            String k = sessionKeyExported.get("k").getAsString();
            byte[] decoded = Base64.decode(k, Base64.NO_PADDING | Base64.NO_WRAP | Base64.URL_SAFE);
            String decryptedKey = CryptoUtils.INSTANCE.bytesToHex(decoded);
            return new RoomKeyResult(decryptedKey, "v2", keyId);
        } else {
            // V1 format
            keyId = keyIdPrefix;
            String k = sessionKey.get("k").getAsString();
            byte[] decoded = Base64.decode(k, Base64.NO_PADDING | Base64.NO_WRAP | Base64.URL_SAFE);
            String decryptedKey = CryptoUtils.INSTANCE.bytesToHex(decoded);
            return new RoomKeyResult(decryptedKey, "v1", keyId);
        }
    }

    private String decryptText(String text, String e2eKey) throws Exception {
        ParsedMessage parsed = parseMessage(text);
        
        String decrypted;
        if (parsed.isV2) {
            // Use AES-GCM decryption for v2
            decrypted = AESCrypto.INSTANCE.decryptGcmBase64(
                parsed.ciphertext, 
                e2eKey, 
                CryptoUtils.INSTANCE.bytesToHex(parsed.iv)
            );
        } else {
            // Use AES-CBC decryption for v1 (existing logic)
            decrypted = AESCrypto.INSTANCE.decryptBase64(
                parsed.ciphertext, 
                e2eKey, 
                CryptoUtils.INSTANCE.bytesToHex(parsed.iv)
            );
        }
        
        byte[] data = Base64.decode(decrypted, Base64.NO_WRAP);
        return new String(data, "UTF-8");
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

            if (ejson.content != null && ("rc.v1.aes-sha2".equals(ejson.content.algorithm) || "rc.v2.aes-sha2".equals(ejson.content.algorithm))) {
                String message = ejson.content.ciphertext;
                String decryptedText = decryptText(message, e2eKey);
                DecryptedContent m = gson.fromJson(decryptedText, DecryptedContent.class);
                return m.msg != null ? m.msg : m.text;
            } else if (ejson.msg != null && !ejson.msg.isEmpty()) {
                String message = ejson.msg;
                String decryptedText = decryptText(message, e2eKey);
                Message m = gson.fromJson(decryptedText, Message.class);
                return m.text;
            } else {
                return null;
            }

        } catch (Exception e) {
            Log.e("[ROCKETCHAT][E2E]", Log.getStackTraceString(e));
        }

        return null;
    }

    public String encryptMessage(final String message, final String id, final Ejson ejson) {
        try {
            AppLifecycleFacade facade = AppLifecycleFacadeHolder.get();
            if (facade != null && facade.getRunningReactContext() instanceof ReactApplicationContext) {
                this.reactContext = (ReactApplicationContext) facade.getRunningReactContext();
            }
            
            Room room = readRoom(ejson);
            if (room == null || !room.encrypted || room.e2eKey == null) {
                return message;
            }

            RoomKeyResult roomKeyResult = decryptRoomKey(room.e2eKey, ejson);
            if (roomKeyResult == null || roomKeyResult.decryptedKey == null) {
                return message;
            }
            String e2eKey = roomKeyResult.decryptedKey;
            String version = roomKeyResult.version;

            Message m = new Message(id, ejson.userId(), message);
            String cypher = gson.toJson(m);

            SecureRandom random = new SecureRandom();
            byte[] bytes;
            String encryptedData;
            
            String keyId = roomKeyResult.keyId;
            
            if ("v2".equals(version)) {
                // V2 format: Use AES-GCM with 12-byte IV
                bytes = new byte[12];
                random.nextBytes(bytes);
                encryptedData = AESCrypto.INSTANCE.encryptGcmBase64(
                    Base64.encodeToString(cypher.getBytes("UTF-8"), Base64.NO_WRAP), 
                    e2eKey, 
                    CryptoUtils.INSTANCE.bytesToHex(bytes)
                );
                
                // Return JSON structure
                JsonObject encryptedJson = new JsonObject();
                encryptedJson.addProperty("kid", keyId);
                encryptedJson.addProperty("iv", Base64.encodeToString(bytes, Base64.NO_WRAP));
                encryptedJson.addProperty("ciphertext", encryptedData);
                return gson.toJson(encryptedJson);
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
                
                // Return keyId + base64(iv + data)
                return keyId + Base64.encodeToString(concat(bytes, data), Base64.NO_WRAP);
            }
        } catch (Exception e) {
            Log.e("[ROCKETCHAT][E2E]", Log.getStackTraceString(e));
        }

        return message;
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