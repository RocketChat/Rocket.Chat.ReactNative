package com.seventheta.notifications

import android.content.Context
import android.os.Bundle
import android.util.Log
import chat.rocket.android_ddp.DDPClient
import chat.rocket.android_ddp.DDPSubscription
import okhttp3.OkHttpClient
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicInteger

class SocketNotificationClient(
        val context: Context,
        val loginData: LoginData,
        val onNotification: (NotificationData) -> Unit) {

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

    private var manualClose = false

    val isConnected: Boolean
        get() = client.isConnected

    var isConnecting: Boolean = false
        private set

    init {
        val wsClient = OkHttpClient.Builder().apply {
            readTimeout(0, TimeUnit.MILLISECONDS)
        }.build()
        val ddpClient = DDPClient(wsClient)
        this.client = ddpClient
    }

    fun connect(onConnect: () -> Unit): Boolean {
        if (isConnected || isConnecting) {
            return false
        }

        val host = loginData.host
        val myUserId = loginData.userId
        val token = loginData.userToken

        val url = "wss://$host/websocket"

        val rooms = mutableMapOf<String, RoomData>()
        val subNum = AtomicInteger(100)
        val activeSubs = mutableListOf<String>()

        Log.d("SOCKETNOTIS", "Connecting to $host...")

        manualClose = false
        isConnecting = true

        client.connect(url).onSuccessTask { task ->
            val result = task.result

            Log.d("SOCKETNOTIS", "Connected to $host.")

            isConnecting = false
            onConnect()

            result.client.onCloseCallback.continueWith { task ->
                Log.e("SOCKETNOTIS", "got onClose for $host.")
                if (!manualClose) {
                    Log.d("SOCKETNOTIS", "non-manual close, reconnecting...")
                    SocketServiceUtils.serviceReconnect(context)
                }
            }

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
                    onNotification(message)
                }
            }

            result.client.rpc("login", JSONArray().apply {
                put(JSONObject().apply {
                    put("resume", token)
                })
            }, "2", 4000)

        }.onSuccessTask { task ->
            val result = task.result
            Log.d("SOCKETNOTIS", "Login successful.")

            result.client.rpc("rooms/get", JSONArray().apply {
                put(JSONObject().apply {
                    put("\$date", 0)
                })
            }, "42", 4000)
        }.onSuccess { task ->
            val result = task.result
            Log.d("SOCKETNOTIS", "Got rooms: $result")
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
                Log.d("SOCKETNOTIS", "Unsubbing: $subId")
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
            val result = task.result
            Log.d("SOCKETNOTIS", "generic continueWith: $result")
            if (task.error != null) {
                Log.e("SOCKETNOTIS", "gotError", task.error)
                Log.d("SOCKETNOTIS", "attempting reconnect with restart")
                SocketServiceUtils.serviceReconnect(context)
            }
            isConnecting = false
            null
        }

        return true
    }

    fun close() {
        Log.d("SOCKETNOTIS", "client connected to ${loginData.host} told to close...")
        manualClose = true
        isConnecting = false
        this.client.close()
    }
}
