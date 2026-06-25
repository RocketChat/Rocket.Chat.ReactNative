package chat.rocket.reactnative.networking;

import com.bumptech.glide.integration.okhttp3.OkHttpUrlLoader;
import com.bumptech.glide.load.model.GlideUrl;
import com.bumptech.glide.Glide;
import com.bumptech.glide.Registry;

import java.io.InputStream;
import okhttp3.OkHttpClient;
import android.content.Context;

import expo.modules.image.okhttp.GlideUrlWrapper;
import expo.modules.image.okhttp.GlideUrlWrapperLoader;

/**
 * Custom class to handle Expo Image OkHttpClient setup
 */
public class ExpoImageClient {
    private static OkHttpClient customClient;

    public static void setOkHttpClient(OkHttpClient client) {
        customClient = client;
    }

    public static void applyToGlide(Context context) {
        if (customClient != null) {
            Registry registry = Glide.get(context).getRegistry();
            
            // Replace standard URL loader
            registry.replace(
                GlideUrl.class,
                InputStream.class,
                new OkHttpUrlLoader.Factory(customClient)
            );
            
            // Also replace the wrapper URL loader used by expo-image
            registry.replace(
                GlideUrlWrapper.class,
                InputStream.class,
                new GlideUrlWrapperLoader.Factory(customClient)
            );
        }
    }
} 