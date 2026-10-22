package chat.rocket.reactnative.networking;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.Promise;
import com.facebook.react.modules.network.OkHttpClientProvider;

import java.io.File;
import java.io.IOException;
import java.net.InetAddress;
import java.net.Socket;
import java.security.GeneralSecurityException;
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
import okhttp3.Cache;
import okhttp3.ConnectionPool;
import android.app.Activity;
import android.content.Context;
import javax.net.ssl.KeyManager;
import android.security.KeyChain;
import android.security.KeyChainAliasCallback;

import java.util.Arrays;
import java.util.Objects;
import java.util.concurrent.TimeUnit;

import com.reactnativecommunity.webview.RNCWebViewManager;
import expo.modules.filesystem.legacy.FileSystemLegacyModule;

public class SSLPinningTurboModule extends NativeSSLPinningSpec implements KeyChainAliasCallback {

    private Promise promise;
    private static volatile String alias;
    private static Context appContext;
    private static final ConnectionPool connectionPool = new ConnectionPool();
    private static final SwappableSSLSocketFactory sslSocketFactory = new SwappableSSLSocketFactory();
    private static final X509TrustManager trustManager = createTrustManager();
    private static final long HTTP_CACHE_SIZE = 10 * 1024 * 1024;

    public static void installOkHttpClientFactory(Context context) {
        appContext = context.getApplicationContext();
        createSSLContext(null);
        // OkHttp forbids two Cache instances on one directory, so every client shares this one
        Cache httpCache = new Cache(new File(appContext.getCacheDir(), "http-cache"), HTTP_CACHE_SIZE);
        OkHttpClientProvider.setOkHttpClientFactory(() ->
            OkHttpClientProvider.createClientBuilder()
                .sslSocketFactory(sslSocketFactory, trustManager)
                .connectionPool(connectionPool)
                .cache(httpCache)
                .build()
        );
        // Keep expo-file-system's own default timeouts and keep downloads out of the HTTP cache
        FileSystemLegacyModule.setOkHttpClient(OkHttpClientProvider.getOkHttpClient().newBuilder()
            .cache(null)
            .connectTimeout(60, TimeUnit.SECONDS)
            .readTimeout(60, TimeUnit.SECONDS)
            .writeTimeout(60, TimeUnit.SECONDS)
            .build());
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
        RNCWebViewManager.setCertificateAlias(name);
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
        X509ExtendedKeyManager keyManager = createKeyManager(name);
        synchronized (SSLPinningTurboModule.class) {
            // A failed lookup leaves the alias unset, so the next setCertificate retries it
            alias = keyManager != null ? name : null;
            createSSLContext(keyManager);
            connectionPool.evictAll();
        }
    }

    private static void createSSLContext(X509ExtendedKeyManager keyManager) {
        try {
            final SSLContext context = SSLContext.getInstance("TLS");
            context.init(keyManager == null ? null : new KeyManager[]{keyManager}, new TrustManager[]{trustManager}, new java.security.SecureRandom());
            sslSocketFactory.setDelegate(context.getSocketFactory());
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException(e);
        }
    }

    private static X509ExtendedKeyManager createKeyManager(String alias) {
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
        return null;
    }

    private static X509TrustManager createTrustManager() {
        try {
            TrustManagerFactory trustManagerFactory = TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm());
            trustManagerFactory.init((KeyStore) null);
            TrustManager[] trustManagers = trustManagerFactory.getTrustManagers();
            if (trustManagers.length != 1 || !(trustManagers[0] instanceof X509TrustManager)) {
                throw new IllegalStateException("Unexpected default trust managers:" + Arrays.toString(trustManagers));
            }
            return (X509TrustManager) trustManagers[0];
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException(e);
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
            return new String[]{alias};
        }

        @Override
        public String[] getServerAliases(String s, Principal[] principals) {
            return new String[]{alias};
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
