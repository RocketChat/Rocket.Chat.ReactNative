package chat.rocket.reactnative.receiver;

import android.content.Context;
import android.content.BroadcastReceiver;
import android.content.Intent;


public class StartMyServiceAtBootReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        if (Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) {
            Intent serviceIntent = new Intent(context, RocketChatBoot.class);
            context.startService(serviceIntent);
        }
    }
}