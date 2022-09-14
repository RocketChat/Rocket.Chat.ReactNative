package chat.rocket.reactnative.share;

import android.os.Bundle;

import com.facebook.react.ReactActivity;
import com.zoontek.rnbootsplash.RNBootSplash;

public class ShareActivity extends ReactActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        RNBootSplash.init(this);
        // https://github.com/software-mansion/react-native-screens/issues/17#issuecomment-424704067
        super.onCreate(null);
    }

    @Override
    protected String getMainComponentName() {
        return "ShareRocketChatRN";
    }
}