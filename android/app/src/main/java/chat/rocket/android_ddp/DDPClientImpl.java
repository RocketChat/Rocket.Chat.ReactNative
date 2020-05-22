package chat.rocket.android_ddp;

import android.text.TextUtils;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import bolts.Task;
import bolts.TaskCompletionSource;
import chat.rocket.android_ddp.rx.RxWebSocket;
import chat.rocket.android_ddp.rx.RxWebSocketCallback;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import okhttp3.OkHttpClient;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import rx.Observable;
import rx.functions.Func1;
import rx.subscriptions.CompositeSubscription;

public class DDPClientImpl {
  private final DDPClient mClient;
  private final RxWebSocket mWebSocket;
  private Observable<RxWebSocketCallback.Base> mObservable;
  private CompositeSubscription mBaseSubscriptions;

  public DDPClientImpl(DDPClient self, OkHttpClient client) {
    mWebSocket = new RxWebSocket(client);
    mClient = self;
  }

  private static JSONObject toJson(String s) {
    if (TextUtils.isEmpty(s)) return null;
    try {
      return new JSONObject(s);
    } catch (JSONException e) {
      return null;
    }
  }

  private static String extractMsg(JSONObject response) {
    if (response == null || response.isNull("msg")) {
      return null;
    } else {
      return response.optString("msg");
    }
  }

  public void connect(final TaskCompletionSource<DDPClientCallback.Connect> task, final String url,
      String session) {
    try {
      mObservable = mWebSocket.connect(url).autoConnect();
      CompositeSubscription subscriptions = new CompositeSubscription();

      subscriptions.add(mObservable.filter(callback -> callback instanceof RxWebSocketCallback.Open)
          .subscribe(callback -> {
            sendMessage("connect",
                json -> (TextUtils.isEmpty(session) ? json : json.put("session", session)).put(
                    "version", "pre2").put("support", new JSONArray().put("pre2").put("pre1")));
          }, err -> {
          }));

      subscriptions.add(
          mObservable.filter(callback -> callback instanceof RxWebSocketCallback.Message)
              .map(callback -> ((RxWebSocketCallback.Message) callback).responseBodyString)
              .map(DDPClientImpl::toJson)
              .subscribe(response -> {
                String msg = extractMsg(response);
                if ("connected".equals(msg) && !response.isNull("session")) {
                  task.setResult(
                      new DDPClientCallback.Connect(mClient, response.optString("session")));
                  subscriptions.unsubscribe();
                } else if ("error".equals(msg) && "Already connected".equals(
                    response.optString("reason"))) {
                  task.setResult(new DDPClientCallback.Connect(mClient, null));
                  subscriptions.unsubscribe();
                } else if ("failed".equals(msg)) {
                  task.setError(
                      new DDPClientCallback.Connect.Failed(mClient, response.optString("version")));
                  subscriptions.unsubscribe();
                }
              }, err -> {
              }));

      addErrorCallback(subscriptions, task);

      subscribeBaseListeners();
    } catch (Exception e) {
      Log.e("connect", "Error", e);
    }
  }

  public boolean isConnected() {
    return mWebSocket != null && mWebSocket.isConnected();
  }

  public void ping(final TaskCompletionSource<DDPClientCallback.Ping> task,
      @Nullable final String id) {
    CompositeSubscription subscriptions = new CompositeSubscription();

    subscriptions.add(
        mObservable.filter(callback -> callback instanceof RxWebSocketCallback.Message)
            .map(callback -> ((RxWebSocketCallback.Message) callback).responseBodyString)
            .map(DDPClientImpl::toJson)
            .timeout(4, TimeUnit.SECONDS)
            .subscribe(response -> {
              String msg = extractMsg(response);
              if ("pong".equals(msg)) {
                if (response.isNull("id")) {
                  task.setResult(new DDPClientCallback.Ping(mClient, null));
                  subscriptions.unsubscribe();
                } else {
                  String _id = response.optString("id");
                  if (id.equals(_id)) {
                    task.setResult(new DDPClientCallback.Ping(mClient, id));
                    subscriptions.unsubscribe();
                  }
                }
              }
            }, err -> {
              task.setError(new DDPClientCallback.Ping.Timeout(mClient));
            }));

    addErrorCallback(subscriptions, task);

    if (TextUtils.isEmpty(id)) {
      sendMessage("ping", null);
    } else {
      sendMessage("ping", json -> json.put("id", id));
    }
  }

  public void sub(final TaskCompletionSource<DDPSubscription.Ready> task, String name,
      JSONArray params, String id) {
    CompositeSubscription subscriptions = new CompositeSubscription();

    subscriptions.add(
        mObservable.filter(callback -> callback instanceof RxWebSocketCallback.Message)
            .map(callback -> ((RxWebSocketCallback.Message) callback).responseBodyString)
            .map(DDPClientImpl::toJson)
            .subscribe(response -> {
              String msg = extractMsg(response);
              if ("ready".equals(msg) && !response.isNull("subs")) {
                JSONArray ids = response.optJSONArray("subs");
                for (int i = 0; i < ids.length(); i++) {
                  String _id = ids.optString(i);
                  if (id.equals(_id)) {
                    task.setResult(new DDPSubscription.Ready(mClient, id));
                    subscriptions.unsubscribe();
                    break;
                  }
                }
              } else if ("nosub".equals(msg) && !response.isNull("id") && !response.isNull(
                  "error")) {
                String _id = response.optString("id");
                if (id.equals(_id)) {
                  task.setError(new DDPSubscription.NoSub.Error(mClient, id,
                      response.optJSONObject("error")));
                  subscriptions.unsubscribe();
                }
              }
            }, err -> {
            }));

    addErrorCallback(subscriptions, task);

    sendMessage("sub", json -> json.put("id", id).put("name", name).put("params", params));
  }

  public void unsub(final TaskCompletionSource<DDPSubscription.NoSub> task,
      @Nullable final String id) {
    CompositeSubscription subscriptions = new CompositeSubscription();

    subscriptions.add(
        mObservable.filter(callback -> callback instanceof RxWebSocketCallback.Message)
            .map(callback -> ((RxWebSocketCallback.Message) callback).responseBodyString)
            .map(DDPClientImpl::toJson)
            .subscribe(response -> {
              String msg = extractMsg(response);
              if ("nosub".equals(msg) && response.isNull("error") && !response.isNull("id")) {
                String _id = response.optString("id");
                if (id.equals(_id)) {
                  task.setResult(new DDPSubscription.NoSub(mClient, id));
                  subscriptions.unsubscribe();
                }
              }
            }, err -> {
            }));

    addErrorCallback(subscriptions, task);

    sendMessage("unsub", json -> json.put("id", id));
  }

  public void rpc(final TaskCompletionSource<DDPClientCallback.RPC> task, String method,
      JSONArray params, String id, long timeoutMs) {
    CompositeSubscription subscriptions = new CompositeSubscription();

    subscriptions.add(
        mObservable.filter(callback -> callback instanceof RxWebSocketCallback.Message)
            .map(callback -> ((RxWebSocketCallback.Message) callback).responseBodyString)
            .map(DDPClientImpl::toJson)
            .timeout(timeoutMs, TimeUnit.MILLISECONDS)
            .subscribe(response -> {
              String msg = extractMsg(response);
              if ("result".equals(msg)) {
                String _id = response.optString("id");
                if (id.equals(_id)) {
                  if (!response.isNull("error")) {
                    task.setError(new DDPClientCallback.RPC.Error(mClient, id,
                        response.optJSONObject("error")));
                  } else {
                    String result = response.optString("result");
                    task.setResult(new DDPClientCallback.RPC(mClient, id, result));
                  }
                  subscriptions.unsubscribe();
                }
              }
            }, err -> {
              if (err instanceof TimeoutException) {
                task.setError(new DDPClientCallback.RPC.Timeout(mClient));
              }
            }));

    addErrorCallback(subscriptions, task);

    sendMessage("method", json -> json.put("method", method).put("params", params).put("id", id));
  }

  private void subscribeBaseListeners() {
    if (mBaseSubscriptions != null &&
        mBaseSubscriptions.hasSubscriptions() && !mBaseSubscriptions.isUnsubscribed()) {
      return;
    }

    mBaseSubscriptions = new CompositeSubscription();
    mBaseSubscriptions.add(
        mObservable.filter(callback -> callback instanceof RxWebSocketCallback.Message)
            .map(callback -> ((RxWebSocketCallback.Message) callback).responseBodyString)
            .map(DDPClientImpl::toJson)
            .subscribe(response -> {
              String msg = extractMsg(response);
              if ("ping".equals(msg)) {
                if (response.isNull("id")) {
                  sendMessage("pong", null);
                } else {
                  sendMessage("pong", json -> json.put("id", response.getString("id")));
                }
              }
            }, err -> {
            }));
  }

  public Observable<DDPSubscription.Event> getDDPSubscription() {
    String[] targetMsgs = { "added", "changed", "removed", "addedBefore", "movedBefore" };
    return mObservable.filter(callback -> callback instanceof RxWebSocketCallback.Message)
        .map(callback -> ((RxWebSocketCallback.Message) callback).responseBodyString)
        .map(DDPClientImpl::toJson)
        .filter(response -> {
          String msg = extractMsg(response);
          for (String m : targetMsgs) {
            if (m.equals(msg)) return true;
          }
          return false;
        })
        .map((Func1<JSONObject, DDPSubscription.Event>) response -> {
          String msg = extractMsg(response);
          if ("added".equals(msg)) {
            return new DDPSubscription.Added(mClient, response.optString("collection"),
                response.optString("id"),
                response.isNull("fields") ? null : response.optJSONObject("fields"));
          } else if ("addedBefore".equals(msg)) {
            return new DDPSubscription.Added.Before(mClient, response.optString("collection"),
                response.optString("id"),
                response.isNull("fields") ? null : response.optJSONObject("fields"),
                response.isNull("before") ? null : response.optString("before"));
          } else if ("changed".equals(msg)) {
            return new DDPSubscription.Changed(mClient, response.optString("collection"),
                response.optString("id"),
                response.isNull("fields") ? null : response.optJSONObject("fields"),
                response.isNull("cleared") ? new JSONArray() : response.optJSONArray("before"));
          } else if ("removed".equals(msg)) {
            return new DDPSubscription.Removed(mClient, response.optString("collection"),
                response.optString("id"));
          } else if ("movedBefore".equals(msg)) {
            return new DDPSubscription.MovedBefore(mClient, response.optString("collection"),
                response.optString("id"),
                response.isNull("before") ? null : response.optString("before"));
          }

          return null;
        })
        .asObservable();
  }

  public void unsubscribeBaseListeners() {
    if (mBaseSubscriptions.hasSubscriptions() && !mBaseSubscriptions.isUnsubscribed()) {
      mBaseSubscriptions.unsubscribe();
    }
  }

  public Task<RxWebSocketCallback.Close> getOnCloseCallback() {
    TaskCompletionSource<RxWebSocketCallback.Close> task = new TaskCompletionSource<>();

    mObservable.filter(callback -> callback instanceof RxWebSocketCallback.Close)
        .cast(RxWebSocketCallback.Close.class)
        .subscribe(close -> {
          task.setResult(close);
        }, err -> {
          if (err instanceof Exception) {
            task.setError((Exception) err);
          } else {
            task.setError(new Exception(err));
          }
        });

    return task.getTask().onSuccessTask(_task -> {
      unsubscribeBaseListeners();
      return _task;
    });
  }

  private void sendMessage(String msg, @Nullable JSONBuilder json) {
    try {
      JSONObject origJson = new JSONObject().put("msg", msg);
      String msg2 = (json == null ? origJson : json.create(origJson)).toString();
      mWebSocket.sendText(msg2);
    } catch (Exception e) {
      Log.e("ANDROID_DDP", "sendMessage", e);
    }
  }

  private void addErrorCallback(CompositeSubscription subscriptions, TaskCompletionSource<?> task) {
    subscriptions.add(mObservable.subscribe(base -> {
    }, err -> {
      task.setError(new Exception(err));
      subscriptions.unsubscribe();
    }));
  }

  public void close(int code, String reason) {
    try {
      mWebSocket.close(code, reason);
    } catch (Exception e) {
      Log.e("ANDROID_DDP", "addErrorCallback", e);
    }
  }

  private interface JSONBuilder {
    @NonNull
    JSONObject create(JSONObject root) throws JSONException;
  }
}
