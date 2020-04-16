package chat.rocket.reactnative;

import com.facebook.react.modules.network.OkHttpClientFactory;

import okhttp3.OkHttpClient;

import com.reactlibrary.UrlCredentialsModule;

public class CustomHttpClient implements OkHttpClientFactory {
    @Override
    public OkHttpClient createNewNetworkModuleClient() {
        return UrlCredentialsModule.getOkHttpClient();
    }
}
