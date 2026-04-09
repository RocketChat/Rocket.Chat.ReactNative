package chat.rocket.reactnative.voip.credentials

import android.content.ContentResolver
import android.provider.Settings
import chat.rocket.reactnative.notification.Ejson

open class MMKVVoipCredentialsProvider(
    private val contentResolver: ContentResolver,
    private val host: String
) : VoipCredentialsProvider {

    protected open fun createEjson(): Ejson =
        Ejson().apply { this.host = host }

    protected open val ejson: Ejson by lazy { createEjson() }

    override fun userId(): String? {
        val userId = ejson.userId()
        return userId.ifEmpty { null }
    }

    override fun token(): String? {
        val token = ejson.token()
        return token.ifEmpty { null }
    }

    override fun deviceId(): String =
        Settings.Secure.getString(contentResolver, Settings.Secure.ANDROID_ID)
}
