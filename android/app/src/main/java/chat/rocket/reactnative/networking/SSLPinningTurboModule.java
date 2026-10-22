package chat.rocket.reactnative.networking;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.Promise;
import com.facebook.react.modules.network.OkHttpClientProvider;
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
import java.util.Objects;

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

    public static void installOkHttpClientFactory(Context context) {
        appContext = context.getApplicationContext();
        OkHttpClientProvider.setOkHttpClientFactory(() ->
            applyClientCertificate(OkHttpClientProvider.createClientBuilder(appContext)).build()
        );
    }

    public static synchronized OkHttpClient getSharedOkHttpClient() {
        if (sharedClient == null) {
            sharedClient = applyClientCertificate(OkHttpClientProvider.createClientBuilder()).build();
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
    }

    @Override
    public String getName() {
        return NativeSSLPinningSpec.NAME;
    }

    @Override
    public void alias(String alias) {
        this.promise.resolve(alias);
    }

    @Override
    public void setCertificate(String name, Promise promise) {
        updateAlias(name);
        OkHttpClient client = getSharedOkHttpClient();

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

    private static void updateAlias(String name) {
        if (Objects.equals(name, alias)) {
            return;
        }
        // KeyChain binds through the main thread, so it must not run under the class lock
        ClientKeyManager keyManager = createKeyManager(name);
        synchronized (SSLPinningTurboModule.class) {
            // Stays null when the lookup failed, so the next setCertificate retries it
            alias = keyManager.alias;
            createSSLContext(keyManager);
            connectionPool.evictAll();
        }
    }

    public static synchronized SSLSocketFactory getSSLFactory() {
        if (sslSocketFactory.delegate == null && !createSSLContext(createKeyManager(null))) {
            return null;
        }
        return sslSocketFactory;
    }

    private static synchronized boolean createSSLContext(X509ExtendedKeyManager keyManager) {
        try {
            final X509TrustManager trustManager = getTrustManagerFactory();
            final SSLContext context = SSLContext.getInstance("TLS");
            context.init(new KeyManager[]{keyManager}, new TrustManager[]{trustManager}, new java.security.SecureRandom());
            sslSocketFactory.setDelegate(context.getSocketFactory());
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private static ClientKeyManager createKeyManager(String alias) {
        if (alias != null) {
            try {
                PrivateKey privateKey = KeyChain.getPrivateKey(appContext, alias);
                X509Certificate[] certificateChain = KeyChain.getCertificateChain(appContext, alias);
                if (privateKey != null && certificateChain != null) {
                    return new ClientKeyManager(alias, privateKey, certificateChain);
                }
            } catch (Exception ignored) {
            }
        }
        return new ClientKeyManager(null, null, null);
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

    private static final class ClientKeyManager extends X509ExtendedKeyManager {
        private final String alias;
        private final PrivateKey privateKey;
        private final X509Certificate[] certificateChain;

        ClientKeyManager(String alias, PrivateKey privateKey, X509Certificate[] certificateChain) {
            this.alias = alias;
            this.privateKey = privateKey;
            this.certificateChain = certificateChain;
        }

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
            return certificateChain;
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
            return privateKey;
        }
    }

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
