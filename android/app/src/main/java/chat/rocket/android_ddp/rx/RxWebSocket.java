package chat.rocket.android_ddp.rx;

import android.util.Log;

import androidx.annotation.Nullable;

import java.io.IOException;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import okhttp3.ResponseBody;
import okhttp3.WebSocket;
import okhttp3.WebSocketListener;
import okio.Buffer;
import okio.ByteString;
import rx.Observable;
import rx.Subscriber;
import rx.exceptions.OnErrorNotImplementedException;
import rx.observables.ConnectableObservable;

public class RxWebSocket {
  private OkHttpClient mHttpClient;
  private WebSocket mWebSocket;
  private boolean mIsConnected;

  public RxWebSocket(OkHttpClient client) {
    mHttpClient = client;
    mIsConnected = false;
  }

  public ConnectableObservable<RxWebSocketCallback.Base> connect(String url) {
    final Request request = new Request.Builder().url(url).build();


    return Observable.create(new Observable.OnSubscribe<RxWebSocketCallback.Base>() {
      @Override public void call(Subscriber<? super RxWebSocketCallback.Base> subscriber) {
        mHttpClient.newWebSocket(request, (new WebSocketListener() {
          @Override public void onOpen(WebSocket webSocket, Response response) {
            mIsConnected = true;
            mWebSocket = webSocket;
            subscriber.onNext(new RxWebSocketCallback.Open(mWebSocket, response));
          }

          @Override public void onFailure(WebSocket webSocket, Throwable t, @Nullable Response response) {
            try {
              mIsConnected = false;
              Log.e("ANDROID_DDP", "onFailure", t);
              subscriber.onError(new RxWebSocketCallback.Failure(mWebSocket, t, response));
            } catch (Exception e) {
              Log.e("ANDROID_DDP", "OnErrorNotImplementedException ignored", e);
            }
          }

          @Override public void onMessage(WebSocket webSocket, String text) {
            mIsConnected = true;
            subscriber.onNext(new RxWebSocketCallback.Message(mWebSocket, text, null));
          }

          @Override public void onMessage(WebSocket webSocket, ByteString bytes) {
            mIsConnected = true;
            subscriber.onNext(new RxWebSocketCallback.Message(mWebSocket, null, bytes));
          }

          @Override public void onClosed(WebSocket webSocket, int code, String reason) {
            mIsConnected = false;
            subscriber.onNext(new RxWebSocketCallback.Close(mWebSocket, code, reason));
            subscriber.onCompleted();
          }
        }));
      }
    }).publish();
  }

  public void sendText(String message) throws IOException {
    mWebSocket.send(message);
  }

  public boolean isConnected() {
    return mIsConnected;
  }

  public void close(int code, String reason) throws IOException {
    mWebSocket.close(code, reason);
  }
}
