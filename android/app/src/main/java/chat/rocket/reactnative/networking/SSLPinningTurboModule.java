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

import java.io.IOException;
import java.net.InetAddress;
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
import okhttp3.ConnectionPool;
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
    private static final ConnectionPool connectionPool = new ConnectionPool();
    private static final SwappableSSLSocketFactory sslSocketFactory = new SwappableSSLSocketFactory();
    private static SSLContext sslContext;

    private static Identity loadedIdentity;

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
        return builder.connectionPool(connectionPool);
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
        updateAlias(alias);
        this.promise.resolve(alias);
    }

    @Override
    public void setCertificate(String name, Promise promise) {
        updateAlias(name);
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

    // Pooled connections and cached TLS sessions keep the identity of the handshake that created
    // them, so they must be dropped or the next request reuses the previous certificate (or none).
    private static synchronized void updateAlias(String name) {
        if (name == null ? alias == null : name.equals(alias)) {
            return;
        }
        alias = name;
        if (sslContext != null) {
            createSSLContext();
        }
        connectionPool.evictAll();
    }

    private static synchronized Identity loadIdentity(String alias) {
        if (alias == null) {
            return null;
        }
        if (loadedIdentity != null && alias.equals(loadedIdentity.alias)) {
            return loadedIdentity;
        }
        try {
            PrivateKey privateKey = KeyChain.getPrivateKey(appContext, alias);
            X509Certificate[] certificateChain = KeyChain.getCertificateChain(appContext, alias);
            if (privateKey == null || certificateChain == null) {
                return null;
            }
            loadedIdentity = new Identity(alias, privateKey, certificateChain);
            return loadedIdentity;
        } catch (Exception e) {
            return null;
        }
    }

    public static synchronized SSLSocketFactory getSSLFactory() {
        if (sslContext == null && !createSSLContext()) {
            return null;
        }
        return sslSocketFactory;
    }

    private static synchronized boolean createSSLContext() {
        try {
            final X509TrustManager trustManager = getTrustManagerFactory();
            final SSLContext context = SSLContext.getInstance("TLS");
            context.init(new KeyManager[]{createKeyManager()}, new TrustManager[]{trustManager}, new java.security.SecureRandom());
            sslContext = context;
            sslSocketFactory.setDelegate(context.getSocketFactory());
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private static X509ExtendedKeyManager createKeyManager() {
        return new X509ExtendedKeyManager() {
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
                Identity identity = loadIdentity(s);
                return identity == null ? null : identity.certificateChain;
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
                Identity identity = loadIdentity(s);
                return identity == null ? null : identity.privateKey;
            }
        };
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

    private static final class Identity {
        final String alias;
        final PrivateKey privateKey;
        final X509Certificate[] certificateChain;

        Identity(String alias, PrivateKey privateKey, X509Certificate[] certificateChain) {
            this.alias = alias;
            this.privateKey = privateKey;
            this.certificateChain = certificateChain;
        }
    }

    // OkHttp keys pooled connections by socket factory, so clients keep this stable instance while
    // the SSLContext behind it (and its TLS session cache) is replaced on alias change.
    private static class SwappableSSLSocketFactory extends SSLSocketFactory {
        private volatile SSLSocketFactory delegate;

        void setDelegate(SSLSocketFactory delegate) {
            this.delegate = delegate;
        }

        @Override
        public String[] getDefaultCipherSuites() {
            return delegate.getDefaultCipherSuites();
        }

        @Override
        public String[] getSupportedCipherSuites() {
            return delegate.getSupportedCipherSuites();
        }

        @Override
        public Socket createSocket() throws IOException {
            return delegate.createSocket();
        }

        @Override
        public Socket createSocket(Socket socket, String host, int port, boolean autoClose) throws IOException {
            return delegate.createSocket(socket, host, port, autoClose);
        }

        @Override
        public Socket createSocket(String host, int port) throws IOException {
            return delegate.createSocket(host, port);
        }

        @Override
        public Socket createSocket(String host, int port, InetAddress localHost, int localPort) throws IOException {
            return delegate.createSocket(host, port, localHost, localPort);
        }

        @Override
        public Socket createSocket(InetAddress host, int port) throws IOException {
            return delegate.createSocket(host, port);
        }

        @Override
        public Socket createSocket(InetAddress address, int port, InetAddress localAddress, int localPort) throws IOException {
            return delegate.createSocket(address, port, localAddress, localPort);
        }
    }
}
