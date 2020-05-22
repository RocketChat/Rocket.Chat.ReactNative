package chat.rocket.android_ddp;

import androidx.annotation.Nullable;

import bolts.Task;
import bolts.TaskCompletionSource;
import chat.rocket.android_ddp.rx.RxWebSocketCallback;
import okhttp3.OkHttpClient;
import org.json.JSONArray;
import rx.Observable;

public class DDPClient {
  // reference: https://github.com/eddflrs/meteor-ddp/blob/master/meteor-ddp.js

  private final DDPClientImpl mImpl;

  public DDPClient(OkHttpClient client) {
    mImpl = new DDPClientImpl(this, client);
  }

  public Task<DDPClientCallback.Connect> connect(String url) {
    return connect(url, null);
  }

  public Task<DDPClientCallback.Connect> connect(String url, String session) {
    TaskCompletionSource<DDPClientCallback.Connect> task = new TaskCompletionSource<>();
    mImpl.connect(task, url, session);
    return task.getTask();
  }

  public Task<DDPClientCallback.Ping> ping(@Nullable String id) {
    TaskCompletionSource<DDPClientCallback.Ping> task = new TaskCompletionSource<>();
    mImpl.ping(task, id);
    return task.getTask();
  }

  public Task<DDPClientCallback.RPC> rpc(String method, JSONArray params, String id,
      long timeoutMs) {
    TaskCompletionSource<DDPClientCallback.RPC> task = new TaskCompletionSource<>();
    mImpl.rpc(task, method, params, id, timeoutMs);
    return task.getTask();
  }

  public Task<DDPSubscription.Ready> sub(String id, String name, JSONArray params) {
    TaskCompletionSource<DDPSubscription.Ready> task = new TaskCompletionSource<>();
    mImpl.sub(task, name, params, id);
    return task.getTask();
  }

  public Task<DDPSubscription.NoSub> unsub(String id) {
    TaskCompletionSource<DDPSubscription.NoSub> task = new TaskCompletionSource<>();
    mImpl.unsub(task, id);
    return task.getTask();
  }

  public Observable<DDPSubscription.Event> getSubscriptionCallback() {
    return mImpl.getDDPSubscription();
  }

  public Task<RxWebSocketCallback.Close> getOnCloseCallback() {
    return mImpl.getOnCloseCallback();
  }

  public boolean isConnected() {
    return mImpl.isConnected();
  }

  public void close() {
    mImpl.close(1000, "closed by DDPClient#close()");
  }
}
