package chat.rocket.reactnative.networking;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.Promise;
import com.facebook.react.modules.network.NetworkingModule;
import com.facebook.react.modules.network.CustomClientBuilder;
import com.facebook.react.modules.network.OkHttpClientProvider;
import com.facebook.react.modules.network.ReactCookieJarContainer;
import com.facebook.react.modules.websocket.WebSocketModule;
import com.facebook.drawee.backends.pipeline.Fresco;
import com.facebook.imagepipeline.core.ImagePipelineConfig;
import com.facebook.imagepipeline.backends.okhttp3.OkHttpImagePipelineConfigFactory;

import java.net.Socket;
import java.security.KeyStore;
import java.security.Principal;
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
import android.content.Context;
import javax.net.ssl.KeyManager;
import android.security.KeyChain;
import android.security.KeyChainAliasCallback;

import java.util.Arrays;
import java.util.concurrent.TimeUnit;

import com.reactnativecommunity.webview.RNCWebViewManager;
import expo.modules.filesystem.legacy.FileSystemLegacyModule;
import chat.rocket.reactnative.networking.ExpoImageClient;

public class SSLPinningTurboModule extends NativeSSLPinningSpec implements KeyChainAliasCallback {

    private Promise promise;
    private static volatile String alias;
    private static Context appContext;
    private static OkHttpClient sharedClient;
    private static SSLSocketFactory sslSocketFactory;

    private static String loadedAlias;
    private static PrivateKey loadedPrivateKey;
    private static X509Certificate[] loadedCertificateChain;

    // Clients built through OkHttpClientProvider (RN networking, expo/fetch) resolve the alias at
    // handshake time, so a certificate picked after they were created is still sent.
    public static void installOkHttpClientFactory(Context context) {
        appContext = context.getApplicationContext();
        OkHttpClientProvider.setOkHttpClientFactory(() ->
            applyClientCertificate(OkHttpClientProvider.createClientBuilder(appContext)).build()
        );
    }

    public static synchronized OkHttpClient getSharedOkHttpClient() {
        if (sharedClient == null) {
            OkHttpClient.Builder builder = new OkHttpClient.Builder()
                    .connectTimeout(0, TimeUnit.MILLISECONDS)
                    .readTimeout(0, TimeUnit.MILLISECONDS)
                    .writeTimeout(0, TimeUnit.MILLISECONDS)
                    .cookieJar(new ReactCookieJarContainer());
            sharedClient = applyClientCertificate(builder).build();
        }
        return sharedClient;
    }

    public static OkHttpClient.Builder applyClientCertificate(OkHttpClient.Builder builder) {
        SSLSocketFactory factory = getSSLFactory();
        X509TrustManager trustManager = getTrustManagerFactory();
        if (factory != null && trustManager != null) {
            builder.sslSocketFactory(factory, trustManager);
        }
        return builder;
    }

    public SSLPinningTurboModule(ReactApplicationContext reactContext) {
        super(reactContext);
        if (appContext == null) {
            appContext = reactContext.getApplicationContext();
        }
    }

    public class CustomClient implements CustomClientBuilder {
        @Override
        public void apply(OkHttpClient.Builder builder) {
            applyClientCertificate(builder);
        }
    }

    @Override
    public String getName() {
        return NativeSSLPinningSpec.NAME;
    }

    @Override
    public void alias(String alias) {
        SSLPinningTurboModule.alias = alias;
        this.promise.resolve(alias);
    }

    @Override
    public void setCertificate(String name, Promise promise) {
        alias = name;
        OkHttpClient client = getSharedOkHttpClient();

        // HTTP Fetch react-native layer
        NetworkingModule.setCustomClientBuilder(new CustomClient());
        // Websocket react-native layer
        WebSocketModule.setCustomClientBuilder(new CustomClient());
        // Image networking react-native layer
        ImagePipelineConfig config = OkHttpImagePipelineConfigFactory
            .newBuilder(appContext, client)
            .build();
        Fresco.initialize(appContext, config);
        // RNCWebView
        RNCWebViewManager.setCertificateAlias(name);

        // Expo File System network layer
        FileSystemLegacyModule.setOkHttpClient(client);
        // Expo Image network layer
        ExpoImageClient.setOkHttpClient(client);
        ExpoImageClient.applyToGlide(appContext);

        promise.resolve(null);
    }

    @Override
    public void pickCertificate(Promise promise) {
        Activity activity = getReactApplicationContext().getCurrentActivity();

        this.promise = promise;

        KeyChain.choosePrivateKeyAlias(activity,
                this, // Callback
                null, // Any key types.
                null, // Any issuers.
                null, // Any host
                -1, // Any port
                "RocketChat");
    }

    private static synchronized boolean loadIdentity(String alias) {
        if (alias == null) {
            return false;
        }
        if (alias.equals(loadedAlias)) {
            return true;
        }
        try {
            PrivateKey privateKey = KeyChain.getPrivateKey(appContext, alias);
            X509Certificate[] certificateChain = KeyChain.getCertificateChain(appContext, alias);
            if (privateKey == null || certificateChain == null) {
                return false;
            }
            loadedAlias = alias;
            loadedPrivateKey = privateKey;
            loadedCertificateChain = certificateChain;
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public static synchronized SSLSocketFactory getSSLFactory() {
        if (sslSocketFactory != null) {
            return sslSocketFactory;
        }
        try {
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
                    return loadIdentity(s) ? loadedCertificateChain : null;
                }

                @Override
                public String[] getClientAliases(String s, Principal[] principals) {
                    return alias == null ? null : new String[]{alias};
                }

                @Override
                public String[] getServerAliases(String s, Principal[] principals) {
                    return alias == null ? null : new String[]{alias};
                }

                @Override
                public PrivateKey getPrivateKey(String s) {
                    return loadIdentity(s) ? loadedPrivateKey : null;
                }
            };

            final X509TrustManager trustManager = getTrustManagerFactory();
            final SSLContext sslContext = SSLContext.getInstance("TLS");
            sslContext.init(new KeyManager[]{keyManager}, new TrustManager[]{trustManager}, new java.security.SecureRandom());

            sslSocketFactory = sslContext.getSocketFactory();
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
