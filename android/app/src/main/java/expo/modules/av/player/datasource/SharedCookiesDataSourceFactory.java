package expo.modules.av.player.datasource;

import android.content.Context;

import com.google.android.exoplayer2.upstream.DataSource;
import com.google.android.exoplayer2.upstream.TransferListener;

import java.util.Map;

import okhttp3.OkHttpClient;

// This class is a workaround to add setOkHttpClient method to the expo-av library
public class SharedCookiesDataSourceFactory {
  private static OkHttpClient client;

  public static void setOkHttpClient(OkHttpClient okHttpClient) {
    client = okHttpClient;
  }

  public SharedCookiesDataSourceFactory(Context reactApplicationContext, String userAgent, Map<String, Object> requestHeaders, TransferListener transferListener) {
    // This constructor is kept empty as the original constructor is called in the superclass
  }
} 