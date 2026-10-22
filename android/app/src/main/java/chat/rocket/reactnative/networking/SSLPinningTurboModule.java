package chat.rocket.reactnative.networking;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.Promise;
import com.facebook.react.modules.network.OkHttpClientProvider;

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
import okhttp3.ConnectionPool;
import android.app.Activity;
import android.content.Context;
import javax.net.ssl.KeyManager;
import android.security.KeyChain;
import android.security.KeyChainAliasCallback;

import java.util.Arrays;
import java.util.concurrent.TimeUnit;

import com.reactnativecommunity.webview.RNCWebViewManager;
import expo.modules.filesystem.legacy.FileSystemLegacyModule;

public class SSLPinningTurboModule extends NativeSSLPinningSpec implements KeyChainAliasCallback {

    private Promise promise;
    private static ClientKeyManager keyManager;
    private static Context appContext;
    private static final ConnectionPool connectionPool = new ConnectionPool();
    private static final SwappableSSLSocketFactory sslSocketFactory = new SwappableSSLSocketFactory();
    private static final X509TrustManager trustManager = createTrustManager();

    public static void installOkHttpClientFactory(Context context) {
        appContext = context.getApplicationContext();
        createSSLContext(null);
        OkHttpClientProvider.setOkHttpClientFactory(() ->
            OkHttpClientProvider.createClientBuilder()
                .sslSocketFactory(sslSocketFactory, trustManager)
                .connectionPool(connectionPool)
                .build()
        );
        // Keep expo-file-system's own default timeouts
        FileSystemLegacyModule.setOkHttpClient(OkHttpClientProvider.getOkHttpClient().newBuilder()
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

    private static synchronized void updateAlias(String name) {
        // Reload every time so a certificate renewed under the same alias is picked up
        ClientKeyManager next = createKeyManager(name);
        if (next == null ? keyManager == null : next.isSameIdentity(keyManager)) {
            return;
        }
        keyManager = next;
        createSSLContext(next);
        connectionPool.evictAll();
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

    private static ClientKeyManager createKeyManager(String alias) {
        if (alias != null) {
            try {
                PrivateKey privateKey = KeyChain.getPrivateKey(appContext, alias);
                X509Certificate[] certificateChain = KeyChain.getCertificateChain(appContext, alias);
                if (privateKey != null && certificateChain != null) {
                    return new ClientKeyManager(alias, privateKey, certificateChain);
                }
            } catch (Exception e) {
                // A failed lookup keeps the identity already loaded for this alias
                return keyManager != null && alias.equals(keyManager.alias) ? keyManager : null;
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

        boolean isSameIdentity(ClientKeyManager other) {
            return other != null && alias.equals(other.alias) && Arrays.equals(certificateChain, other.certificateChain);
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
