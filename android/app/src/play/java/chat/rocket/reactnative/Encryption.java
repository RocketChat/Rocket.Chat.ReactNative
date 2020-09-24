package chat.rocket.reactnative;

import android.util.Log;
import android.util.Base64;
import android.database.Cursor;

import com.pedrouid.crypto.RSA;
import com.pedrouid.crypto.RCTAes;
import com.pedrouid.crypto.RCTRsaUtils;
import com.pedrouid.crypto.Util;

import com.google.gson.Gson;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;

import com.nozbe.watermelondb.Database;

import java.util.Arrays;
import java.security.SecureRandom;

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
    private String E2ERoomKey;
    private String keyId;

    public static Encryption shared = new Encryption();
    private ReactApplicationContext reactContext;

    public Room readRoom(final Ejson ejson) {
        Database database = new Database(ejson.serverURL().replace("https://", "") + "-experimental.db", reactContext);
        String[] query = {ejson.rid};
        Cursor cursor = database.rawQuery("select * from subscriptions where id == ? limit 1", query);

        // Room not found
        if (cursor.getCount() == 0) {
            return null;
        }

        cursor.moveToFirst();
        String e2eKey = cursor.getString(cursor.getColumnIndex("e2e_key"));
        Boolean encrypted = cursor.getInt(cursor.getColumnIndex("encrypted")) > 0;
        cursor.close();

        return new Room(e2eKey, encrypted);
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

        return new RCTRsaUtils().jwkToPrivatePkcs1(jwk);
    }

    public String decryptRoomKey(final String e2eKey, final Ejson ejson) throws Exception {
        String key = e2eKey.substring(12, e2eKey.length());
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

            String message = ejson.msg;
            String msg = message.substring(12, message.length());
            byte[] msgData = Base64.decode(msg, Base64.NO_WRAP);

            String b64 = Base64.encodeToString(Arrays.copyOfRange(msgData, 16, msgData.length), Base64.DEFAULT);

            String decrypted = RCTAes.decrypt(b64, e2eKey, Util.bytesToHex(Arrays.copyOfRange(msgData, 0, 16)));
            byte[] data = Base64.decode(decrypted, Base64.NO_WRAP);
            Message m = gson.fromJson(new String(data, "UTF-8"), Message.class);

            return m.text;
        } catch (Exception e) {
            Log.d("[ROCKETCHAT][ENCRYPTION]", Log.getStackTraceString(e));
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
            Log.d("[ROCKETCHAT][ENCRYPTION]", Log.getStackTraceString(e));
        }

        return message;
    }

    static byte[] concat(byte[]... arrays) {
        // Determine the length of the result array
        int totalLength = 0;
        for (int i = 0; i < arrays.length; i++) {
            totalLength += arrays[i].length;
        }

        // create the result array
        byte[] result = new byte[totalLength];

        // copy the source arrays into the result array
        int currentIndex = 0;
        for (int i = 0; i < arrays.length; i++) {
            System.arraycopy(arrays[i], 0, result, currentIndex, arrays[i].length);
            currentIndex += arrays[i].length;
        }

        return result;
    }
}
