package chat.rocket.reactnative.voip.credentials

import android.content.Context
import android.provider.Settings
import chat.rocket.reactnative.notification.Ejson

open class MMKVVoipCredentialsProvider(
    private val context: Context,
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
        Settings.Secure.getString(context.contentResolver, Settings.Secure.ANDROID_ID)
}
