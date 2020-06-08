package com.seventheta.notifications

import android.app.AlarmManager
import android.app.PendingIntent
import android.app.Service
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.ConnectivityManager
import android.net.wifi.WifiManager
import android.os.*
import android.util.Log
import chat.rocket.reactnative.BuildConfig
import kotlin.math.min

class SocketService : Service() {

    private lateinit var wifiManager: WifiManager
    private lateinit var alarmManager: AlarmManager
    private lateinit var connectivityManager: ConnectivityManager

    private var isDestroyed = false
    private var retryInterval = 500L

    private val connectivityListener: BroadcastReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {

        }
    }

    override fun onCreate() {
        super.onCreate()
        wifiManager = applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager
        alarmManager = applicationContext.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        connectivityManager = applicationContext.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        registerReceiver(connectivityListener, IntentFilter("android.net.conn.CONNECTIVITY_CHANGE"))
    }

    override fun onDestroy() {
        isDestroyed = true
        super.onDestroy()
    }

    override fun onTaskRemoved(rootIntent: Intent?) {
        val restartService = Intent(applicationContext, this.javaClass).apply {
            setPackage(packageName)
        }
        val restartServiceIntent = PendingIntent.getService(applicationContext, 1, restartService, PendingIntent.FLAG_ONE_SHOT)
        alarmManager!![3, SystemClock.elapsedRealtime() + 3000L] = restartServiceIntent
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (_client == null) {
            Log.d("SOCKETNOTIS", "constructing client...")
            _client = SocketNotificationManager(applicationContext)
        }

        val client = _client!!
        val action = intent?.action

        if (action != null) {
            when (action) {
                EXTRA_ACTION_RECONNECT -> {
                    disconnectAndReconnect()
                    return Service.START_STICKY
                }
            }
        }

        if (!client.isConnected) {
            val didConnect = connectClient()
            if (!didConnect) {

            }
        }

        Log.d("SOCKETNOTIS", "No command, rescheduling...")

        return Service.START_STICKY
    }

    private fun disconnectAndReconnect() {
        _client?.close()
        Handler(Looper.getMainLooper()).postDelayed({
            val didConnect = connectClient()
            if (!didConnect) {

            }
        }, 500)
    }

    private fun connectClient(): Boolean {
        Log.d("SOCKETNOTIS", "connecting...")
        val client = _client!!
        return client.evaluateAndConnect { interval ->

        }
    }

    private fun getAlarmPendingIntent(action: String?): PendingIntent {
        val keepAliveIntent = Intent()
        keepAliveIntent.setClass(this, SocketService::class.java)
        keepAliveIntent.action = action
        return PendingIntent.getService(this, 0, keepAliveIntent, 0)
    }

    fun scheduleReconnect() {
        val now = System.currentTimeMillis()
        if (retryInterval < 60000L) {
            retryInterval = min(retryInterval * 2L, 60000L)
        }
        val keepAliveIntent = getAlarmPendingIntent(EXTRA_ACTION_RECONNECT)
        alarmManager!![0, now + retryInterval] = keepAliveIntent
    }

    fun cancelReconnect() {
        val reconnectIntent = getAlarmPendingIntent(EXTRA_ACTION_RECONNECT)
        alarmManager!!.cancel(reconnectIntent)
    }

    override fun onBind(intent: Intent?): IBinder? = null

    companion object {

        var _client: SocketNotificationManager? = null

        const val EXTRA_ACTION_START = "${BuildConfig.APPLICATION_ID}.extra.ACTION_START"
        const val EXTRA_ACTION_RECONNECT = "${BuildConfig.APPLICATION_ID}.extra.ACTION_RECONNECT"
        const val EXTRA_ACTION_KEEP_ALIVE = "${BuildConfig.APPLICATION_ID}.extra.ACTION_KEEP_ALIVE"
        const val EXTRA_ACTION_STOP = "${BuildConfig.APPLICATION_ID}.extra.COMMAND_STOP"

        fun startService(context: Context) {

        }

        fun serviceReconnect(context: Context) {

        }

        fun stopService(context: Context) {

        }
    }
}