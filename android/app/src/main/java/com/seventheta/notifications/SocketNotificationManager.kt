package com.seventheta.notifications

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Color
import android.media.RingtoneManager
import android.net.ConnectivityManager
import android.os.Build
import android.os.Bundle
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import chat.rocket.android_ddp.DDPClient
import chat.rocket.android_ddp.DDPSubscription
import chat.rocket.reactnative.R
import com.bumptech.glide.Glide
import com.bumptech.glide.load.resource.bitmap.RoundedCorners
import com.bumptech.glide.request.RequestOptions
import okhttp3.OkHttpClient
import org.json.JSONArray
import org.json.JSONObject
import java.net.URL
import java.util.concurrent.ExecutionException
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicInteger

class SocketNotificationManager(val context: Context) {

    private val clients = mutableListOf<SocketNotificationClient>()
    private val notiId = AtomicInteger(0)
    private val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager

    val isConnected: Boolean
        get() {
            if (clients.isEmpty()) {
                return false
            }
            return clients.fold(true, { acc, client -> acc && client.isConnected })
        }

    val isConnecting: Boolean
        get() {
            if (clients.isEmpty()) {
                return false
            }
            return clients.fold(false, { acc, client -> acc || client.isConnecting })
        }

    fun evaluateAndConnect(performReschedule: (Long) -> Unit): Boolean {
        Log.d("SOCKETNOTIS", "evaluateAndConnect...")
        val prefs = context.getSharedPreferences("react-native", Context.MODE_PRIVATE)
        val allPrefs = prefs.all

        if (allPrefs[SOCKET_NOTIFICATIONS_KEY] == "false") {
            Log.d("SOCKETNOTIS", "disabled by preference")
            return false
        }

        if (!connectivityManager.isConnectedToNetwork) {
            Log.d("SOCKETNOTIS", "not connected to network, rescheduling...")
            performReschedule(1000L * 15)
            return false
        }

        if (isConnecting) {
            Log.d("SOCKETNOTIS", "already connecting...")
            return true
        }

        if (isConnected) {
            Log.d("SOCKETNOTIS", "already connected, rescheduling...")
            performReschedule(1000L * 15)
            return false
        }

        val clients = allPrefs.keys.mapNotNull { prefKey ->
            return@mapNotNull if (userTokenRegex.containsMatchIn(prefKey)) {
                val host = URL(prefKey.split("-")[1]).host
                val userId = allPrefs[prefKey] as String
                val userTokenKey = "reactnativemeteor_usertoken-$userId"
                val userToken = allPrefs[userTokenKey] as String
                val loginData = SocketNotificationClient.LoginData(host, userId, userToken)
                SocketNotificationClient(context, loginData, onNotification = { data ->
                    displayNotification(loginData, data)
                })
            } else {
                null
            }
        }

        if (clients.isEmpty()) {
            Log.d("SOCKETNOTIS", "no available clients found...")
            return false
        }

        val numToConnect = AtomicInteger(clients.size)
        var performingWork = false
        Log.d("SOCKETNOTIS", "Connecting to ${numToConnect.get()} clients...")
        clients.forEach { client ->
            if (client.isConnected || client.isConnecting) {
                performingWork = client.isConnecting || performingWork
                val remaining = numToConnect.decrementAndGet()
                Log.d("SOCKETNOTIS", "Already connected/connecting. Remaining: $remaining")
                if (remaining == 0) {
                    Log.d("SOCKETNOTIS", "All already connected/connecting. Rescheduling...")
                    performReschedule(1000L * 15)
                }
            } else {
                performingWork = true
                client.connect() {
                    val remaining = numToConnect.decrementAndGet()
                    Log.d("SOCKETNOTIS", "Connected. Remaining: $remaining")
                    if (remaining == 0) {
                        Log.d("SOCKETNOTIS", "All connected. Rescheduling")
                        performReschedule(1000L * 15)
                    }
                }
            }
        }
        this.clients.addAll(clients)

        Log.d("SOCKETNOTIS", "evaluateEnd")
        return performingWork
    }

    fun close() {
        Log.d("SOCKETNOTIS", "manager told to close")
        this.clients.forEach { client ->
            client.close()
        }
        this.clients.clear()
    }

    private fun displayNotification(loginData: SocketNotificationClient.LoginData, data: SocketNotificationClient.NotificationData) {
        Log.d("SOCKETNOTIS", "displaying notification: $data")
        val intent = Intent(context, NotificationsDeliveryService::class.java)
        intent.putExtra(NotificationsDeliveryService.EXTRA_NOTIFICATION_DATA, data.data)
        val contentIntent = PendingIntent.getService(context, System.currentTimeMillis().toInt(), intent, PendingIntent.FLAG_ONE_SHOT)

        val channelId = "rocketchatrn_channel_01"
        val builder: NotificationCompat.Builder = NotificationCompat.Builder(context, channelId)
                .setContentTitle("New message from ${data.senderUsername}")
                .setContentText(data.message)
                .setContentIntent(contentIntent)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setDefaults(NotificationCompat.DEFAULT_ALL)
                .setAutoCancel(true)
                .setColor(ContextCompat.getColor(context, R.color.notification_text))
                .setSmallIcon(context.resources.getIdentifier("ic_notification", "mipmap", context.packageName))
                .setLargeIcon(getAvatar(loginData.constructAvatarURLForSender(data.senderUsername)))
                .setLights(Color.RED, 1000, 1000)
                .setVibrate(longArrayOf(0, 400, 250, 400))
                .setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION))

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channelName = "All"
            val channel = NotificationChannel(channelId, channelName, NotificationManager.IMPORTANCE_HIGH)
            //channel.description = "Rocket Chat Notification Channel"
            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
            builder.setChannelId(channelId)
        }

        val notificationManager: NotificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.notify(notiId.incrementAndGet(), builder.build())
    }

    private fun getAvatar(uri: String): Bitmap? {
        return try {
            Glide.with(context)
                .asBitmap()
                .apply(RequestOptions.bitmapTransform(RoundedCorners(10)))
                .load(uri)
                .submit(100, 100)
                .get()
        } catch (e: Exception) {
            val resources = context.resources
            val largeIconResId: Int = resources.getIdentifier("ic_launcher", "mipmap", context.packageName)
            return BitmapFactory.decodeResource(resources, largeIconResId)
        }
    }

    companion object {

        const val SOCKET_NOTIFICATIONS_KEY = "RC_SOCKET_NOTIFICATIONS_KEY"
        val userTokenRegex = "reactnativemeteor_usertoken-[a-z][a-z0-9+\\-.]*://([a-z0-9\\-._~%!\$&'()*+,;=]+@)?([a-z0-9\\-._~%]+|\\[[a-f0-9:.]+\\]|\\[v[a-f0-9][a-z0-9\\-._~%!\$&'()*+,;=:]+\\])(:[0-9]+)?(/[a-z0-9\\-._~%!\$&'()*+,;=:@]+)*/?(\\?[a-z0-9\\-._~%!\$&'()*+,;=:@/?]*)?(#[a-z0-9\\-._~%!\$&'()*+,;=:@/?]*)?".toRegex()
    }
}
