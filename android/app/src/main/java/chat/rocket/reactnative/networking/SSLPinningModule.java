package chat.rocket.reactnative.networking;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.modules.network.NetworkingModule;
import com.facebook.react.modules.network.CustomClientBuilder;
import com.facebook.react.modules.network.ReactCookieJarContainer;
import com.facebook.react.modules.websocket.WebSocketModule;
import com.facebook.react.modules.fresco.ReactOkHttpNetworkFetcher;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;

import java.net.Socket;
import java.security.Principal;
import java.security.cert.CertificateException;
import java.security.cert.X509Certificate;
import javax.net.ssl.X509ExtendedKeyManager;
import java.security.PrivateKey;
import javax.net.ssl.SSLContext;
import javax.net.ssl.X509TrustManager;
import javax.net.ssl.SSLSocketFactory;
import javax.net.ssl.TrustManager;
import okhttp3.OkHttpClient;
import java.lang.InterruptedException;
import android.app.Activity;
import javax.net.ssl.KeyManager;
import android.security.KeyChain;
import android.security.KeyChainAliasCallback;
import java.util.concurrent.TimeUnit;

import com.RNFetchBlob.RNFetchBlob;

import com.reactnativecommunity.webview.RNCWebViewManager;

import com.dylanvann.fastimage.FastImageOkHttpUrlLoader;

import expo.modules.av.player.datasource.SharedCookiesDataSourceFactory;

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
                if (sslSocketFactory != null) {
                    builder.sslSocketFactory(sslSocketFactory);
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
            if (sslSocketFactory != null) {
                builder.sslSocketFactory(sslSocketFactory);
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

        // HTTP Fetch react-native layer
        NetworkingModule.setCustomClientBuilder(new CustomClient());
        // Websocket react-native layer
        WebSocketModule.setCustomClientBuilder(new CustomClient());
        // Image networking react-native layer
        ReactOkHttpNetworkFetcher.setOkHttpClient(getOkHttpClient());
        // RNFetchBlob networking layer
        RNFetchBlob.applyCustomOkHttpClient(getOkHttpClient());
        // RNCWebView onReceivedClientCertRequest
        RNCWebViewManager.setCertificateAlias(data);
        // FastImage Glide network layer
        FastImageOkHttpUrlLoader.setOkHttpClient(getOkHttpClient());
        // Expo AV network layer
        SharedCookiesDataSourceFactory.setOkHttpClient(getOkHttpClient());

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

            final TrustManager[] trustAllCerts = new TrustManager[] {
                    new X509TrustManager() {
                        @Override
                        public void checkClientTrusted(java.security.cert.X509Certificate[] chain, String authType) throws CertificateException {
                        }

                        @Override
                        public void checkServerTrusted(java.security.cert.X509Certificate[] chain, String authType) throws CertificateException {
                        }

                        @Override
                        public java.security.cert.X509Certificate[] getAcceptedIssuers() {
                            return certChain;
                        }
                    }
            };

            final SSLContext sslContext = SSLContext.getInstance("TLS");
            sslContext.init(new KeyManager[]{keyManager}, trustAllCerts, new java.security.SecureRandom());
            SSLContext.setDefault(sslContext);

            final SSLSocketFactory sslSocketFactory = sslContext.getSocketFactory();

            return sslSocketFactory;
        } catch (Exception e) {
            return null;
        }
    }
}
