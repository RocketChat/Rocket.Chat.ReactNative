package chat.rocket.reactnative;

import android.os.Build;
import com.facebook.react.modules.network.OkHttpClientFactory;
import com.facebook.react.modules.network.ReactCookieJarContainer;

import okhttp3.Interceptor;
import okhttp3.OkHttpClient;
import okhttp3.Response;

public class UserAgentClientFactory implements OkHttpClientFactory {
  @Override
  public OkHttpClient createNewNetworkModuleClient() {
    return new OkHttpClient.Builder().cookieJar(new ReactCookieJarContainer()).addNetworkInterceptor(new CustomInterceptor()).build();
  }
}