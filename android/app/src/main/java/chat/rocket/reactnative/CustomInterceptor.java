package chat.rocket.reactnative;

import android.os.Build;

import okhttp3.Interceptor;
import okhttp3.Request;
import okhttp3.Response;

import java.io.IOException;

public class CustomInterceptor implements Interceptor {

    public CustomInterceptor() {}

    @Override
    public Response intercept(Interceptor.Chain chain) throws IOException {
        Request originalRequest = chain.request();
        Request requestWithUserAgent = originalRequest.newBuilder()
            .removeHeader("User-Agent")
            .addHeader("User-Agent", "RC-RN Mobile/" + BuildConfig.VERSION_NAME + " (build: " + BuildConfig.VERSION_CODE + "; OS: Android " + Build.VERSION.RELEASE + ")")
            .build();

        return chain.proceed(requestWithUserAgent);
    }
}