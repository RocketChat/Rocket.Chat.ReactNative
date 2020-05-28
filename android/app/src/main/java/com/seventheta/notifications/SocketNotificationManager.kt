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

    data class LoginData(
            val host: String,
            val userId: String,
            val userToken: String) {

        fun constructAvatarURLForSender(sender: String): String {
            return "https://$host/avatar/$sender?rc_token=$userToken&rc_uid=$userId"
        }
    }

    data class RoomData(
            val id: String,
            val type: String)

    data class NotificationData(
            val senderUsername: String,
            val message: String,
            val data: Bundle)

    private val client: DDPClient
    private val notiId = AtomicInteger(0)

    val isConnected: Boolean
        get() = client.isConnected

    init {
        val wsClient = OkHttpClient.Builder().apply {
            readTimeout(0, TimeUnit.MILLISECONDS)
            hostnameVerifier { hostname, session -> true }
        }.build()
        val ddpClient = DDPClient(wsClient)
        this.client = ddpClient
    }

    fun connect(onConnect: () -> Unit): Boolean {
        val prefs = context.getSharedPreferences("react-native", Context.MODE_PRIVATE)
        val allPrefs = prefs.all

        if (allPrefs[SOCKET_NOTIFICATIONS_KEY] != "true") {
            return false
        }

        val loginDatas = allPrefs.keys.mapNotNull { prefKey ->
            return@mapNotNull if (userTokenRegex.containsMatchIn(prefKey)) {
                val host = URL(prefKey.split("-")[1]).host
                val userId = allPrefs[prefKey] as String
                val userTokenKey = "reactnativemeteor_usertoken-$userId"
                val userToken = allPrefs[userTokenKey] as String
                LoginData(host, userId, userToken)
            } else {
                null
            }
        }

        val numToConnect = AtomicInteger(loginDatas.size)
        loginDatas.forEach { data ->
            connect(data) {
                val remaining = numToConnect.decrementAndGet()
                if (remaining == 0) {
                    onConnect()
                }
            }
        }

        return true
    }

    fun connect(loginData: LoginData, onConnect: () -> Unit): Boolean {
        val host = loginData.host
        val myUserId = loginData.userId
        val token = loginData.userToken

        val url = "wss://$host/websocket"

        val rooms = mutableMapOf<String, RoomData>()
        val subNum = AtomicInteger(100)
        val activeSubs = mutableListOf<String>()

        client.connect(url).onSuccessTask { task ->
            val result = task.result

            onConnect()

            // observe all callback events.
            result.client.subscriptionCallback.subscribe { event ->
                Log.d("SOCKETNOTIS", "Got sub event: $event")
                if (event !is DDPSubscription.Changed) {
                    return@subscribe
                }
                if (event.collection != "stream-room-messages") {
                    return@subscribe
                }
                val json = event.fields
                val args = json.getJSONArray("args")
                val messages = mutableListOf<NotificationData>()
                for (i in 0 until args.length()) {
                    val message = args.getJSONObject(i)
                    val msg = message.getString("msg")
                    val user = message.getJSONObject("u")
                    val userId = user.getString("_id")

                    if (userId != myUserId) {
                        val roomId = message.getString("rid")
                        val username = user.getString("username")
                        val mentions = message.getJSONArray("mentions")
                        val mentionedUserIds = mutableListOf<String>()
                        for (j in 0 until mentions.length()) {
                            val mention = mentions.getJSONObject(j)
                            val userId = mention.getString("_id")
                            val username = mention.getString("username")
                            mentionedUserIds.add(userId)
                        }
                        val ejson = JSONObject().apply {
                            put("rid", roomId)
                            put("name", userId)
                            put("sender", JSONObject().apply {
                                put("username", username)
                                put("name", username)
                            })
                            put("type", rooms[roomId]?.type ?: "d")
                            put("host", host)
                        }
                        val data = Bundle().apply {
                            putString("ejson", ejson.toString())
                        }
                        val notiData = NotificationData(username, msg, data)
                        messages.add(notiData)
                    }
                }

                messages.forEach { message ->
                    displayNotification(message, loginData)
                }
            }

            result.client.rpc("login", JSONArray().apply {
                put(JSONObject().apply {
                    put("resume", token)
                })
            }, "2", 4000)

        }.onSuccessTask { task ->
            val result = task.getResult()
            result.client.rpc("rooms/get", JSONArray().apply {
                put(JSONObject().apply {
                    put("\$date", 0)
                })
            }, "42", 4000)
        }.onSuccess { task ->
            val result = task.result
            val json = JSONObject(result.result)
            val updates = json.getJSONArray("update")
            val roomIds = mutableListOf<String>()
            for (i in 0 until updates.length()) {
                val room = updates.getJSONObject(i)
                val roomId = room.getString("_id")
                val type = room.getString("t")
                val roomData = RoomData(roomId, type)
                rooms[roomId] = roomData
                roomIds.add(roomId)
            }

            Log.d("SOCKETNOTIS", result.result)
//            result.client.sub("83854", "stream-room-messages", JSONArray().apply {
//                put(roomIds.first())
//                put(false)
//            })

            activeSubs.forEach { subId ->
                result.client.unsub(subId).onSuccess { task -> }
            }
            activeSubs.clear()

            for (i in 0 until roomIds.size) {
                val roomId = roomIds.get(i)
                val subIdNum = subNum.incrementAndGet()
                val subId = "$subIdNum"
                Log.d("SOCKETNOTIS", "SUBBING $roomId")
                result.client.sub(subId, "stream-room-messages", JSONArray().apply {
                    put(roomId)
                    put(false)
                }).onSuccess { task ->
                    activeSubs.add(subId)
                }
            }

//            val roomId = roomIds.get(i)
//            return@onSuccessTask result.client.sub("83854", "stream-room-messages", JSONArray().apply {
//                put(roomIds.last())
//                put(false)
//            })

        }.continueWith<Any> { task ->
            null
        }

        return true
    }

    fun close() {
        this.client.close()
    }

    private fun displayNotification(data: NotificationData, loginData: LoginData) {
        val intent = Intent(context, NotificationsDeliveryService::class.java)
        intent.putExtra(NotificationsDeliveryService.EXTRA_NOTIFICATION_DATA, data.data)
        val contentIntent = PendingIntent.getService(context, System.currentTimeMillis().toInt(), intent, PendingIntent.FLAG_ONE_SHOT)

        val channelId = "chat.rocket.7theta.channel"
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
            val channelId = "rocketchatrn_channel_01"
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
