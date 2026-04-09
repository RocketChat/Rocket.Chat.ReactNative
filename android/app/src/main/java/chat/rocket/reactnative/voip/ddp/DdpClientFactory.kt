package chat.rocket.reactnative.voip.ddp

import chat.rocket.reactnative.voip.VoipPerCallDdpRegistry
import okhttp3.OkHttpClient
import java.util.concurrent.TimeUnit

interface DdpClientFactory {
    fun createClient(callId: String): DdpClient
}

internal class DefaultDdpClientFactory(
    private val registry: VoipPerCallDdpRegistry<DdpClient>
) : DdpClientFactory {

    private val okHttpClient = OkHttpClient.Builder()
        .pingInterval(30, TimeUnit.SECONDS)
        .build()

    override fun createClient(callId: String): DdpClient {
        val client = DdpClientImpl(okHttpClient)
        registry.putClient(callId, client)
        return client
    }
}
