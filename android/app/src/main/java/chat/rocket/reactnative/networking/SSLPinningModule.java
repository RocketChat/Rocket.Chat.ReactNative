package chat.rocket.reactnative.networking;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.modules.network.NetworkingModule;
import com.facebook.react.modules.network.CustomClientBuilder;
import com.facebook.react.modules.network.ReactCookieJarContainer;
import com.facebook.react.modules.websocket.WebSocketModule;
import com.facebook.drawee.backends.pipeline.Fresco;
import com.facebook.imagepipeline.core.ImagePipelineConfig;
import com.facebook.imagepipeline.backends.okhttp3.OkHttpImagePipelineConfigFactory;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;

import java.net.Socket;
import java.security.KeyStore;
import java.security.Principal;
import java.security.cert.CertificateException;
import java.security.cert.X509Certificate;

import javax.net.ssl.TrustManagerFactory;
import javax.net.ssl.X509ExtendedKeyManager;
import java.security.PrivateKey;
import javax.net.ssl.SSLContext;
import javax.net.ssl.X509TrustManager;
import javax.net.ssl.SSLSocketFactory;
import javax.net.ssl.TrustManager;
import okhttp3.OkHttpClient;
import android.app.Activity;
import javax.net.ssl.KeyManager;
import android.security.KeyChain;
import android.security.KeyChainAliasCallback;

import java.util.Arrays;
import java.util.concurrent.TimeUnit;

import com.reactnativecommunity.webview.RNCWebViewManager;

import expo.modules.av.player.datasource.SharedCookiesDataSourceFactory;
import expo.modules.filesystem.FileSystemModule;
import expo.modules.image.okhttp.ExpoImageOkHttpClientGlideModule;

public class SSLPinningModule extends ReactContextBaseJavaModule implements KeyChainAliasCallback {

    private Promise promise;
    private static String alias;
    private static ReactApplicationContext reactContext;

    public SSLPinningModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    public class CustomClient implements CustomClientBuilder {
        @Override
        public void apply(OkHttpClient.Builder builder) {
            if (alias != null) {
                SSLSocketFactory sslSocketFactory = getSSLFactory(alias);
                X509TrustManager trustManager = getTrustManagerFactory();
                if (sslSocketFactory != null) {
                    builder.sslSocketFactory(sslSocketFactory, trustManager);
                }
            }
        }
    }

    protected OkHttpClient getOkHttpClient() {
        OkHttpClient.Builder builder = new OkHttpClient.Builder()
                .connectTimeout(0, TimeUnit.MILLISECONDS)
                .readTimeout(0, TimeUnit.MILLISECONDS)
                .writeTimeout(0, TimeUnit.MILLISECONDS)
                .cookieJar(new ReactCookieJarContainer());

        if (alias != null) {
            SSLSocketFactory sslSocketFactory = getSSLFactory(alias);
            X509TrustManager trustManager = getTrustManagerFactory();
            if (sslSocketFactory != null) {
                builder.sslSocketFactory(sslSocketFactory, trustManager);
            }
        }

        return builder.build();
    }

    @Override
    public String getName() {
        return "SSLPinning";
    }

    @Override
    public void alias(String alias) {
        this.alias = alias;

        this.promise.resolve(alias);
    }

    @ReactMethod
    public void setCertificate(String data, Promise promise) {
        this.alias = data;
        OkHttpClient client = getOkHttpClient();

        // HTTP Fetch react-native layer
        NetworkingModule.setCustomClientBuilder(new CustomClient());
        // Websocket react-native layer
        WebSocketModule.setCustomClientBuilder(new CustomClient());
        // Image networking react-native layer
        ImagePipelineConfig config = OkHttpImagePipelineConfigFactory
            .newBuilder(this.reactContext, client)
            .build();
        Fresco.initialize(this.reactContext, config);
        // RNCWebView onReceivedClientCertRequest
        RNCWebViewManager.setCertificateAlias(data);

        // Expo AV network layer
        SharedCookiesDataSourceFactory.setOkHttpClient(client);
        // Expo File System network layer
        FileSystemModule.setOkHttpClient(client);
        // Expo Image network layer
        ExpoImageOkHttpClientGlideModule.Companion.setOkHttpClient(client);

        promise.resolve(null);
    }

    @ReactMethod
    public void pickCertificate(Promise promise) {
        Activity activity = getCurrentActivity();

        this.promise = promise;

        KeyChain.choosePrivateKeyAlias(activity,
                this, // Callback
                null, // Any key types.
                null, // Any issuers.
                null, // Any host
                -1, // Any port
                "RocketChat");
    }

    public static SSLSocketFactory getSSLFactory(final String alias) {
        try {
            final PrivateKey privKey = KeyChain.getPrivateKey(reactContext, alias);
            final X509Certificate[] certChain = KeyChain.getCertificateChain(reactContext, alias);

            final X509ExtendedKeyManager keyManager = new X509ExtendedKeyManager() {
                @Override
                public String chooseClientAlias(String[] strings, Principal[] principals, Socket socket) {
                    return alias;
                }

                @Override
                public String chooseServerAlias(String s, Principal[] principals, Socket socket) {
                    return alias;
                }

                @Override
                public X509Certificate[] getCertificateChain(String s) {
                    return certChain;
                }

                @Override
                public String[] getClientAliases(String s, Principal[] principals) {
                    return new String[]{alias};
                }

                @Override
                public String[] getServerAliases(String s, Principal[] principals) {
                    return new String[]{alias};
                }

                @Override
                public PrivateKey getPrivateKey(String s) {
                    return privKey;
                }
            };

            final X509TrustManager trustManager = getTrustManagerFactory();
            final SSLContext sslContext = SSLContext.getInstance("TLS");
            sslContext.init(new KeyManager[]{keyManager}, new TrustManager[]{trustManager}, new java.security.SecureRandom());
            SSLContext.setDefault(sslContext);

            final SSLSocketFactory sslSocketFactory = sslContext.getSocketFactory();

            return sslSocketFactory;
        } catch (Exception e) {
            return null;
        }
    }

    public static X509TrustManager getTrustManagerFactory() {
        try {
            TrustManagerFactory trustManagerFactory = TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm());
            trustManagerFactory.init((KeyStore) null);
            TrustManager[] trustManagers = trustManagerFactory.getTrustManagers();
            if (trustManagers.length != 1 || !(trustManagers[0] instanceof X509TrustManager)) {
                throw new IllegalStateException("Unexpected default trust managers:" + Arrays.toString(trustManagers));
            }
            final X509TrustManager trustManager = (X509TrustManager) trustManagers[0];
            return trustManager;
        } catch (Exception e) {
            return null;
        }
    }
}
