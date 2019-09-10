package chat.rocket.reactnative.pushnotification

import kotlinx.serialization.Serializable

@Serializable
data class Ejson(val host: String, val rid: String, val sender: Sender) {
    override fun toString(): String = host + rid

    val avatarUri: String = "${removeTrailingSlash(host)}/avatar/${sender.username}"

    private fun removeTrailingSlash(baseUrl: String): String {
        var url = baseUrl
        if (url.endsWith('/')) url = url.dropLast(1)
        return url
    }
}

@Serializable
data class Sender(val username: String)