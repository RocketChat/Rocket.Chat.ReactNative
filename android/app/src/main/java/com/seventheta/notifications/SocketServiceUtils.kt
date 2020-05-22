package com.seventheta.notifications

import android.content.Context
import android.os.Build

object SocketServiceUtils {

    private val useJobService = Build.VERSION.SDK_INT >= 26

    fun startService(context: Context) {
        if (useJobService) {
            SocketJobService.startService(context)
        } else {
            SocketService.startService(context)
        }
    }

    fun serviceReconnect(context: Context) {
        if (useJobService) {
            SocketJobService.serviceReconnect(context)
        } else {
            SocketService.startService(context)
        }
    }
}