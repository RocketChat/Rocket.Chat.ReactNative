package chat.rocket.reactnative.pushnotification

import kotlinx.serialization.Serializable

@Serializable
data class Ejson(val host: String, val rid: String) {
    override fun toString(): String = host + rid
}