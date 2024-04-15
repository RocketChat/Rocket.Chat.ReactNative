package chat.rocket.reachout;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class DismissNotification extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        int notId = intent.getExtras().getInt(CustomPushNotification.NOTIFICATION_ID);
        CustomPushNotification.clearMessages(notId);
    }
}
