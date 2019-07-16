package chat.rocket.reactnative.jitsi;

import java.util.Map;
import java.util.HashMap;

import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.util.Log;
import android.content.Intent;
import android.support.v4.app.FragmentActivity;

import com.facebook.react.ReactInstanceManager;
import com.facebook.react.modules.core.PermissionListener;

import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.bridge.ReadableMap;

import org.jitsi.meet.sdk.JitsiMeetView;
import org.jitsi.meet.sdk.JitsiMeetViewListener;
import org.jitsi.meet.sdk.JitsiMeetActivityInterface;
import org.jitsi.meet.sdk.JitsiMeetActivityDelegate;
import org.jitsi.meet.sdk.JitsiMeetConferenceOptions;

public class JitsiMeetRNActivity extends FragmentActivity implements JitsiMeetViewListener, JitsiMeetActivityInterface {

    /**
     * Instance of the {@link JitsiMeetView} which this activity will display.
     */
    private JitsiMeetView view;


    @Override
    protected void onActivityResult(
            int requestCode,
            int resultCode,
            Intent data) {
        JitsiMeetActivityDelegate.onActivityResult(
                this, requestCode, resultCode, data);
    }

    @Override
    public void onBackPressed() {
        JitsiMeetActivityDelegate.onBackPressed();
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        String url = getIntent().getStringExtra("url");
        view = new JitsiMeetView(this);
        view.setListener(this);
        JitsiMeetConferenceOptions options = new JitsiMeetConferenceOptions.Builder()
            .setRoom(url)
            .build();
        // view.join(options); <- issue here

        setContentView(view);
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();

        if (view != null) {
            view.dispose();
            view = null;
        }

        JitsiMeetActivityDelegate.onHostDestroy(this);
    }

    @Override
    public void onNewIntent(Intent intent) {
        JitsiMeetActivityDelegate.onNewIntent(intent);
    }

    // https://developer.android.com/reference/android/support/v4/app/ActivityCompat.OnRequestPermissionsResultCallback
    @Override
    public void onRequestPermissionsResult(
            final int requestCode,
            final String[] permissions,
            final int[] grantResults) {
        JitsiMeetActivityDelegate.onRequestPermissionsResult(requestCode, permissions, grantResults);
    }

    /**
     * Implementation of the {@code PermissionAwareActivity} interface.
     */
    @Override
    public void requestPermissions(String[] permissions, int requestCode, PermissionListener listener) {
        JitsiMeetActivityDelegate.requestPermissions(this, permissions, requestCode, listener);
    }

    @Override
    protected void onResume() {
        super.onResume();

        JitsiMeetActivityDelegate.onHostResume(this);
    }

    @Override
    public void onStop() {
        super.onStop();

        JitsiMeetActivityDelegate.onHostPause(this);
    }

    @Override
    protected void onUserLeaveHint() {
        if (view != null) {
            view.enterPictureInPicture();
        }
    }

    private void on(String name, Map<String, Object> data) {
        UiThreadUtil.assertOnUiThread();

        // Log with the tag "ReactNative" in order to have the log
        // visible in react-native log-android as well.
        Log.d(
            "JitsiMeet",
            JitsiMeetViewListener.class.getSimpleName() + " "
                + name + " "
                + data);
        Intent intent = new Intent(name);
        intent.putExtra("data", (HashMap<String, Object>) data);
        sendBroadcast(intent, getApplication().getPackageName() + ".permission.JITSI_BROADCAST");
    }

    public void onConferenceJoined(Map<String, Object> data) {
        on("CONFERENCE_JOINED", data);
    }

    public void onConferenceTerminated(Map<String, Object> data) {
        this.onBackPressed();
        on("CONFERENCE_LEFT", data);
    }

    public void onConferenceWillJoin(Map<String, Object> data) {
        on("CONFERENCE_WILL_JOIN", data);
    }
}
