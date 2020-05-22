package chat.rocket.android_ddp;

import androidx.annotation.NonNull;

import org.json.JSONArray;
import org.json.JSONObject;

public class DDPSubscription {
  public static abstract class Event {
    public final DDPClient client;

    public Event(DDPClient client) {
      this.client = client;
    }
  }

  public static abstract class BaseException extends Exception {
    public final DDPClient client;

    public BaseException(DDPClient client) {
      this.client = client;
    }
  }

  public static class NoSub extends Event {
    public String id;

    public NoSub(DDPClient client, String id) {
      super(client);
      this.id = id;
    }

    @Override public String toString() {
      return "NoSub[id=" + id + "]";
    }

    public static class Error extends BaseException {
      String id;
      JSONObject error;

      public Error(DDPClient client, String id, JSONObject error) {
        super(client);
        this.id = id;
        this.error = error;
      }
    }
  }

  public static class Ready extends Event {
    public String id;

    public Ready(DDPClient client, String id) {
      super(client);
      this.id = id;
    }

    @Override public String toString() {
      return "Ready[id=" + id + "]";
    }
  }

  public static class DocEvent extends Event {
    public String collection;
    public String docID;

    public DocEvent(DDPClient client, String collection, String docID) {
      super(client);
      this.collection = collection;
      this.docID = docID;
    }

    @Override public String toString() {
      return "DocEvent[id=" + docID + ", collection=" + collection + "]";
    }
  }

  public static class Added extends DocEvent {
    public JSONObject fields;

    public Added(DDPClient client, String collection, String docID, JSONObject fields) {
      super(client, collection, docID);
      this.fields = fields;
    }

    public static class Before extends Added {
      public String before;

      public Before(DDPClient client, String collection, String docID, JSONObject fields,
          String before) {
        super(client, collection, docID, fields);
        this.before = before;
      }
    }
  }

  public static class Changed extends DocEvent {
    public JSONObject fields;
    public JSONArray cleared;

    public Changed(DDPClient client, String collection, String docID, JSONObject fields,
        @NonNull JSONArray cleared) {
      super(client, collection, docID);
      this.fields = fields;
      this.cleared = cleared;
    }
  }

  public static class Removed extends DocEvent {

    public Removed(DDPClient client, String collection, String docID) {
      super(client, collection, docID);
    }
  }

  public static class MovedBefore extends DocEvent {
    public String before;

    public MovedBefore(DDPClient client, String collection, String docID, String before) {
      super(client, collection, docID);
      this.before = before;
    }
  }
}
