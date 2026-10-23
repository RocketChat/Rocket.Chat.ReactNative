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
import okhttp3.HttpUrl;
import android.app.Activity;
import android.content.Context;
import android.content.SharedPreferences;
import android.os.Handler;
import android.os.Looper;
import android.webkit.WebView;
import javax.net.ssl.HostnameVerifier;
import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.KeyManager;
import android.security.KeyChain;
import android.security.KeyChainAliasCallback;
import android.util.Log;

import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.Callable;
import java.util.concurrent.TimeUnit;

import com.reactnativecommunity.webview.RNCWebViewClient;
import expo.modules.filesystem.legacy.FileSystemLegacyModule;

public class SSLPinningTurboModule extends NativeSSLPinningSpec implements KeyChainAliasCallback {

    private static final String TAG = "RocketChat.SSLPinning";

    private Promise promise;
    private static Context appContext;
    private static SharedPreferences aliasesByHost;
    private static final ConnectionPool connectionPool = new ConnectionPool(20, 5, TimeUnit.MINUTES);
    private static final ResettableSSLSocketFactory sslSocketFactory = new ResettableSSLSocketFactory();
    private static final X509TrustManager trustManager = createTrustManager();
    // A custom verifier stops OkHttp from sharing an HTTP/2 connection, and its certificate, across hosts
    private static final HostnameVerifier hostnameVerifier = HttpsURLConnection.getDefaultHostnameVerifier();
    private static final Map<String, String> hostsByConnection = Collections.synchronizedMap(new LinkedHashMap<String, String>() {
        @Override
        protected boolean removeEldestEntry(Map.Entry<String, String> eldest) {
            return size() > 256;
        }
    });

    public static void installClientCertificates(Context context) {
        appContext = context.getApplicationContext();
        aliasesByHost = appContext.getSharedPreferences("RocketChat.ClientCertificateAliases", Context.MODE_PRIVATE);
        RNCWebViewClient.setCertificateAliasResolver(SSLPinningTurboModule::aliasForHost);
        OkHttpClientProvider.setOkHttpClientFactory(() ->
            OkHttpClientProvider.createClientBuilder()
                .sslSocketFactory(sslSocketFactory, trustManager)
                .hostnameVerifier(hostnameVerifier)
                .connectionPool(connectionPool)
                .build()
        );
        // Keep expo-file-system's own default timeouts
        FileSystemLegacyModule.setOkHttpClient(OkHttpClientProvider.createClient().newBuilder()
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
    public void setCertificate(String name, String server, Promise promise) {
        updateAlias(server, name);
        promise.resolve(null);
    }

    @Override
    public void removeCertificate(String server) {
        updateAlias(server, null);
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

    private static synchronized void updateAlias(String server, String alias) {
        HttpUrl url = HttpUrl.parse(server);
        if (url == null || Objects.equals(alias, aliasesByHost.getString(url.host(), null))) {
            return;
        }
        aliasesByHost.edit().putString(url.host(), alias).commit();
        // A fresh SSLContext has no cached sessions, so none resume with the previous identity
        sslSocketFactory.reset();
        connectionPool.evictAll();
        new Handler(Looper.getMainLooper()).post(SSLPinningTurboModule::clearWebViewCertificateChoices);
    }

    private static void clearWebViewCertificateChoices() {
        try {
            WebView.clearClientCertPreferences(null);
        } catch (RuntimeException e) {
            Log.w(TAG, "Failed to clear the WebView client certificate choices", e);
        }
    }

    private static String aliasForHost(String host) {
        return host == null ? null : aliasesByHost.getString(host.toLowerCase(Locale.ROOT), null);
    }

    private static String connectionKey(Socket socket) {
        return socket.getInetAddress() + ":" + socket.getPort() + ":" + socket.getLocalPort();
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
        @Override
        public String chooseClientAlias(String[] keyTypes, Principal[] issuers, Socket socket) {
            // Keyed by the connection, as Android 7-8 sockets have no handshake session at this point
            return aliasForHost(hostsByConnection.get(connectionKey(socket)));
        }

        @Override
        public String chooseServerAlias(String keyType, Principal[] issuers, Socket socket) {
            return null;
        }

        @Override
        public X509Certificate[] getCertificateChain(String alias) {
            return fromKeyChain("certificate chain", () -> KeyChain.getCertificateChain(appContext, alias));
        }

        @Override
        public String[] getClientAliases(String keyType, Principal[] issuers) {
            return null;
        }

        @Override
        public String[] getServerAliases(String keyType, Principal[] issuers) {
            return null;
        }

        @Override
        public PrivateKey getPrivateKey(String alias) {
            return fromKeyChain("private key", () -> KeyChain.getPrivateKey(appContext, alias));
        }

        private static <T> T fromKeyChain(String what, Callable<T> load) {
            try {
                return load.call();
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                return null;
            } catch (Exception | AssertionError e) {
                Log.w(TAG, "Failed to load the client certificate " + what, e);
                return null;
            }
        }
    }

    private static class ResettableSSLSocketFactory extends SSLSocketFactory {
        private SSLSocketFactory delegate;

        synchronized void reset() {
            delegate = null;
        }

        private synchronized SSLSocketFactory delegate() {
            if (delegate == null) {
                try {
                    final SSLContext context = SSLContext.getInstance("TLS");
                    context.init(new KeyManager[]{new ClientKeyManager()}, new TrustManager[]{trustManager}, new java.security.SecureRandom());
                    delegate = context.getSocketFactory();
                } catch (GeneralSecurityException e) {
                    throw new IllegalStateException(e);
                }
            }
            return delegate;
        }

        @Override
        public String[] getDefaultCipherSuites() {
            return delegate().getDefaultCipherSuites();
        }

        @Override
        public String[] getSupportedCipherSuites() {
            return delegate().getSupportedCipherSuites();
        }

        @Override
        public Socket createSocket() throws IOException {
            return delegate().createSocket();
        }

        @Override
        public Socket createSocket(Socket socket, String host, int port, boolean autoClose) throws IOException {
            hostsByConnection.put(connectionKey(socket), host);
            return delegate().createSocket(socket, host, port, autoClose);
        }

        @Override
        public Socket createSocket(String host, int port) throws IOException {
            return delegate().createSocket(host, port);
        }

        @Override
        public Socket createSocket(String host, int port, InetAddress localHost, int localPort) throws IOException {
            return delegate().createSocket(host, port, localHost, localPort);
        }

        @Override
        public Socket createSocket(InetAddress host, int port) throws IOException {
            return delegate().createSocket(host, port);
        }

        @Override
        public Socket createSocket(InetAddress address, int port, InetAddress localAddress, int localPort) throws IOException {
            return delegate().createSocket(address, port, localAddress, localPort);
        }
    }
}
