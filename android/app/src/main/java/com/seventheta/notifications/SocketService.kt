package com.seventheta.notifications

import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import chat.rocket.reactnative.BuildConfig

class SocketService : Service() {

    private var client: SocketNotificationManager? = null

    override fun onBind(intent: Intent): IBinder? = null

    override fun onCreate() {
        super.onCreate()

        client = SocketNotificationManager(this)
    }

    override fun onDestroy() {
        val client = this.client
        if (client != null) {
            if (client.isConnected) {
                client.close()
            }
        }
        super.onDestroy()
    }

    companion object {

        const val ACTION_START = "${BuildConfig.APPLICATION_ID}.intent.ACTION_START"

        fun startService(context: Context) {
            val intent = Intent(context, SocketService::class.java).apply {
                action = ACTION_START
            }
            context.startService(intent)
        }

        fun stopService(context: Context) {
            val intent = Intent(context, SocketService::class.java)
            context.stopService(intent)
        }
    }
}