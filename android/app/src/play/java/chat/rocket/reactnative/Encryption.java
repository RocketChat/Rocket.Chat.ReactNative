package chat.rocket.reactnative;

import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.util.Base64;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.WritableMap;
import com.google.gson.Gson;
import com.pedrouid.crypto.RCTAes;
import com.pedrouid.crypto.RCTRsaUtils;
import com.pedrouid.crypto.RSA;
import com.pedrouid.crypto.Util;

import java.io.File;
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

    DecryptedContent(String msg) {
        this.msg = msg;
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

class Encryption {
    private Gson gson = new Gson();
    private String keyId;

    public static Encryption shared = new Encryption();
    private ReactApplicationContext reactContext;

    public Room readRoom(final Ejson ejson) {
        String dbName = getDatabaseName(ejson.serverURL());
        SQLiteDatabase db = null;

        try {
            db = SQLiteDatabase.openDatabase(dbName, null, SQLiteDatabase.OPEN_READONLY);
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

        String dbName = serverUrl.replace("https://", "");
        if (!isOfficial) {
            dbName += "-experimental";
        }
        // Old issue. Safer to accept it then to migrate away from it.
        dbName += ".db.db";
        // https://github.com/Nozbe/WatermelonDB/blob/a757e646141437ad9a06f7314ad5555a8a4d252e/native/android-jsi/src/main/java/com/nozbe/watermelondb/jsi/JSIInstaller.java#L18
        File databasePath = new File(reactContext.getDatabasePath(dbName).getPath().replace("/databases", ""));
        return databasePath.getPath();
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

        return new RCTRsaUtils(reactContext).jwkToPrivatePkcs1(jwk);
    }

    public String decryptRoomKey(final String e2eKey, final Ejson ejson) throws Exception {
        String key = e2eKey.substring(12);
        keyId = e2eKey.substring(0, 12);

        String userKey = readUserKey(ejson);
        if (userKey == null) {
            return null;
        }

        RSA rsa = new RSA();
        rsa.setPrivateKey(userKey);
        String decrypted = rsa.decrypt(key);

        RoomKey roomKey = gson.fromJson(decrypted, RoomKey.class);
        byte[] decoded = Base64.decode(roomKey.k, Base64.NO_PADDING | Base64.NO_WRAP | Base64.URL_SAFE);

        return Util.bytesToHex(decoded);
    }

    private String decryptText(String text, String e2eKey) throws Exception {
        String msg = text.substring(12);
        byte[] msgData = Base64.decode(msg, Base64.NO_WRAP);
        String b64 = Base64.encodeToString(Arrays.copyOfRange(msgData, 16, msgData.length), Base64.DEFAULT);
        String decrypted = RCTAes.decrypt(b64, e2eKey, Util.bytesToHex(Arrays.copyOfRange(msgData, 0, 16)));
        byte[] data = Base64.decode(decrypted, Base64.NO_WRAP);
        return new String(data, "UTF-8");
    }

    public String decryptMessage(final Ejson ejson, final ReactApplicationContext reactContext) {
        try {
            this.reactContext = reactContext;

            Room room = readRoom(ejson);
            if (room == null || room.e2eKey == null) {
                return null;
            }
            String e2eKey = decryptRoomKey(room.e2eKey, ejson);
            if (e2eKey == null) {
                return null;
            }

            if (ejson.msg != null && !ejson.msg.isEmpty()) {
                String message = ejson.msg;
                String decryptedText = decryptText(message, e2eKey);
                Message m = gson.fromJson(decryptedText, Message.class);
                return m.text;
            } else if (ejson.content != null && "rc.v1.aes-sha2".equals(ejson.content.algorithm)) {
                String message = ejson.content.ciphertext;
                String decryptedText = decryptText(message, e2eKey);
                DecryptedContent m = gson.fromJson(decryptedText, DecryptedContent.class);
                return m.msg;
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
            Room room = readRoom(ejson);
            if (room == null || !room.encrypted || room.e2eKey == null) {
                return message;
            }

            String e2eKey = decryptRoomKey(room.e2eKey, ejson);
            if (e2eKey == null) {
                return message;
            }

            Message m = new Message(id, ejson.userId(), message);
            String cypher = gson.toJson(m);

            SecureRandom random = new SecureRandom();
            byte[] bytes = new byte[16];
            random.nextBytes(bytes);

            String encrypted = RCTAes.encrypt(Base64.encodeToString(cypher.getBytes("UTF-8"), Base64.NO_WRAP), e2eKey, Util.bytesToHex(bytes));
            byte[] data = Base64.decode(encrypted, Base64.NO_WRAP);

            return keyId + Base64.encodeToString(concat(bytes, data), Base64.NO_WRAP);
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