package chat.rocket.reactnative;

import com.facebook.react.ReactPackage;

import java.util.Arrays;
import java.util.List;

import io.invertase.firebase.analytics.ReactNativeFirebaseAnalyticsPackage;
import io.invertase.firebase.app.ReactNativeFirebaseAppPackage;
import io.invertase.firebase.crashlytics.ReactNativeFirebaseCrashlyticsPackage;

public class AdditionalModules {
    public List<ReactPackage> getAdditionalModules() {
        return Arrays.<ReactPackage>asList(
                new ReactNativeFirebaseAnalyticsPackage(),
                new ReactNativeFirebaseAppPackage(),
                new ReactNativeFirebaseCrashlyticsPackage()
        );
    }
}
