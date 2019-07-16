
/*
  Author: mfmendiola (source: https://gist.github.com/mfmendiola/bb8397162df9f76681325ab9f705748b#file-maputil-java)
  ArrayUtil exposes a set of helper methods for working with
  ReadableArray (by React Native), Object[], and JSONArray.
*/

package chat.rocket.reactnative.jitsi;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableType;
import com.facebook.react.bridge.WritableArray;

import java.util.Map;

import org.json.JSONArray;
import org.json.JSONObject;
import org.json.JSONException;

public class ArrayUtil {

  public static JSONArray toJSONArray(ReadableArray readableArray) throws JSONException {
    JSONArray jsonArray = new JSONArray();

    for (int i = 0; i < readableArray.size(); i++) {
      ReadableType type = readableArray.getType(i);

      switch (type) {
        case Null:
          jsonArray.put(i, null);
          break;
        case Boolean:
          jsonArray.put(i, readableArray.getBoolean(i));
          break;
        case Number:
          jsonArray.put(i, readableArray.getDouble(i));
          break;
        case String:
          jsonArray.put(i, readableArray.getString(i));
          break;
        case Map:
          jsonArray.put(i, MapUtil.toJSONObject(readableArray.getMap(i)));
          break;
        case Array:
          jsonArray.put(i, ArrayUtil.toJSONArray(readableArray.getArray(i)));
          break;
      }
    }

    return jsonArray;
  }

  public static Object[] toArray(JSONArray jsonArray) throws JSONException {
    Object[] array = new Object[jsonArray.length()];

    for (int i = 0; i < jsonArray.length(); i++) {
      Object value = jsonArray.get(i);

      if (value instanceof JSONObject) {
        value = MapUtil.toMap((JSONObject) value);
      }
      if (value instanceof JSONArray) {
        value = ArrayUtil.toArray((JSONArray) value);
      }

      array[i] = value;
    }

    return array;
  }

  public static Object[] toArray(ReadableArray readableArray) {
    Object[] array = new Object[readableArray.size()];

    for (int i = 0; i < readableArray.size(); i++) {
      ReadableType type = readableArray.getType(i);

      switch (type) {
        case Null:
          array[i] = null;
          break;
        case Boolean:
          array[i] = readableArray.getBoolean(i);
          break;
        case Number:
          array[i] = readableArray.getDouble(i);
          break;
        case String:
          array[i] = readableArray.getString(i);
          break;
        case Map:
          array[i] = MapUtil.toMap(readableArray.getMap(i));
          break;
        case Array:
          array[i] = ArrayUtil.toArray(readableArray.getArray(i));
          break;
      }
    }

    return array;
  }

  public static WritableArray toWritableArray(Object[] array) {
    WritableArray writableArray = Arguments.createArray();

    for (int i = 0; i < array.length; i++) {
      Object value = array[i];

      if (value == null) {
        writableArray.pushNull();
      }
      if (value instanceof Boolean) {
        writableArray.pushBoolean((Boolean) value);
      }
      if (value instanceof Double) {
        writableArray.pushDouble((Double) value);
      }
      if (value instanceof Integer) {
        writableArray.pushInt((Integer) value);
      }
      if (value instanceof String) {
        writableArray.pushString((String) value);
      }
      if (value instanceof Map) {
        writableArray.pushMap(MapUtil.toWritableMap((Map<String, Object>) value));
      }
      if (value.getClass().isArray()) {
        writableArray.pushArray(ArrayUtil.toWritableArray((Object[]) value));
      }
    }

    return writableArray;
  }
}
