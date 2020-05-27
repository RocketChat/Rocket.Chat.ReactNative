package com.seventheta.notifications

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class PackageUpdatedBroadcastReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        SocketServiceUtils.startService(context)
    }
}