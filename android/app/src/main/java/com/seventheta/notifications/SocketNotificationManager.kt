package com.seventheta.notifications

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.job.JobService
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.media.RingtoneManager
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import bolts.Task
import chat.rocket.android_ddp.DDPClient
import chat.rocket.android_ddp.DDPSubscription
import chat.rocket.reactnative.MainActivity
import okhttp3.OkHttpClient
import org.json.JSONArray
import org.json.JSONObject
import java.net.URL
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicInteger

class SocketNotificationManager(val context: Context) {

    data class NotificationData(
            val senderUsername: String,
            val message: String)

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

        val userToken = allPrefs.get("reactnativemeteor_usertoken") as? String
        val currentServer = allPrefs.get("currentServer") as? String
        if (userToken == null || currentServer == null) {
            return false
        }

        val url = "wss://${URL(currentServer).host}/websocket"

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
                    val username = user.getString("username")
                    val mentions = message.getJSONArray("mentions")
                    val mentionedUserIds = mutableListOf<String>()
                    for (j in 0 until mentions.length()) {
                        val mention = mentions.getJSONObject(j)
                        val userId = mention.getString("_id")
                        val username = mention.getString("username")
                        mentionedUserIds.add(userId)
                    }
                    val notiData = NotificationData(username, msg)
                    messages.add(notiData)
                }

                messages.forEach { message ->
                    displayNotification(message)
                }
            }

            result.client.rpc("login", JSONArray().apply {
                put(JSONObject().apply {
                    put("resume", userToken)
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
                roomIds.add(roomId)
            }

            Log.d("SOCKETNOTIS", result.result)
//            result.client.sub("83854", "stream-room-messages", JSONArray().apply {
//                put(roomIds.first())
//                put(false)
//            })

            val tasks = mutableListOf<Task<DDPSubscription.Ready>>()
            for (i in 0 until roomIds.size) {
                val roomId = roomIds.get(i)
                Log.d("SOCKETNOTIS", "SUBBING $roomId")
                result.client.sub("83854$i", "stream-room-messages", JSONArray().apply {
                    put(roomId)
                    put(false)
                }).onSuccess { task ->


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

    private fun displayNotification(data: NotificationData) {
        val builder: NotificationCompat.Builder = NotificationCompat.Builder(context)
                .setAutoCancel(true)
                .setSmallIcon(context.resources.getIdentifier("ic_notification", "mipmap", context.packageName))
                .setContentTitle("New message from ${data.senderUsername}")
                .setContentText(data.message)
                .setLights(Color.RED, 1000, 1000)
                .setVibrate(longArrayOf(0, 400, 250, 400))
                .setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION))
                .setContentIntent(PendingIntent.getActivity(context, 0, Intent(context, MainActivity::class.java), PendingIntent.FLAG_UPDATE_CURRENT))

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            // Create the NotificationChannel
            val importance = NotificationManager.IMPORTANCE_DEFAULT
            val mChannel = NotificationChannel("chat.rocket.7theta.channel", "RocketChat Notifications", importance)
            mChannel.description = "Rocket Chat Notification Channel"
            val notificationManager = context.getSystemService(JobService.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(mChannel)
            builder.setChannelId("chat.rocket.7theta.channel")
        }

        val notificationManager: NotificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.notify(notiId.incrementAndGet(), builder.build())
    }
}