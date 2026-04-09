package chat.rocket.reactnative.voip.signaling

import android.content.Context
import android.provider.Settings
import chat.rocket.reactnative.voip.VoipPayload
import chat.rocket.reactnative.voip.credentials.VoipCredentialsProvider
import io.mockk.MockKAnnotations
import io.mockk.every
import io.mockk.impl.annotations.MockK
import io.mockk.mockkStatic
import android.util.Log
import org.json.JSONArray
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Before
import org.junit.Test

class CallSignalBuilderTest {

    @MockK
    private lateinit var mockContext: Context

    @MockK
    private lateinit var mockContentResolver: android.content.ContentResolver

    @MockK
    private lateinit var mockCredentialsProvider: VoipCredentialsProvider

    private lateinit var builder: DefaultCallSignalBuilder

    private val testHost = "https://open.rocket.chat"
    private val testUserId = "user123"
    private val testDeviceId = "device456"

    private fun createPayload(): VoipPayload = VoipPayload(
        callId = "call_abc",
        caller = "caller_name",
        username = "caller_username",
        host = testHost,
        type = "incoming_call",
        hostName = "Rocket.Chat",
        avatarUrl = null,
        createdAt = "2026-04-09T12:00:00.000Z"
    )

    @Before
    fun setup() {
        MockKAnnotations.init(this)

        mockkStatic(Settings.Secure::class)
        mockkStatic(Log::class)
        every { mockContext.contentResolver } returns mockContentResolver
        every {
            Settings.Secure.getString(mockContentResolver, Settings.Secure.ANDROID_ID)
        } returns testDeviceId

        every { mockCredentialsProvider.userId() } returns testUserId
        every { mockCredentialsProvider.deviceId() } returns testDeviceId

        builder = DefaultCallSignalBuilder(mockCredentialsProvider)
    }

    @Test
    fun `accept signal has correct JSON structure`() {
        val payload = createPayload()

        val result = builder.buildAcceptSignal(mockContext, payload)

        assertNotNull(result)
        assertEquals(2, result!!.length())
        assertEquals("${testUserId}/media-calls", result.getString(0))

        val signalJson = JSONObject(result.getString(1))
        assertEquals("call_abc", signalJson.getString("callId"))
        assertEquals("device456", signalJson.getString("contractId"))
        assertEquals("answer", signalJson.getString("type"))
        assertEquals("accept", signalJson.getString("answer"))
    }

    @Test
    fun `accept signal includes supportedFeatures only on accept`() {
        val payload = createPayload()

        val result = builder.buildAcceptSignal(mockContext, payload)

        assertNotNull(result)
        val signalJson = JSONObject(result!!.getString(1))
        assertNotNull(signalJson.opt("supportedFeatures"))
        assertEquals("audio", signalJson.getJSONArray("supportedFeatures").getString(0))
    }

    @Test
    fun `reject signal has correct JSON structure`() {
        val payload = createPayload()

        val result = builder.buildRejectSignal(mockContext, payload)

        assertNotNull(result)
        assertEquals(2, result!!.length())
        assertEquals("${testUserId}/media-calls", result.getString(0))

        val signalJson = JSONObject(result.getString(1))
        assertEquals("call_abc", signalJson.getString("callId"))
        assertEquals("device456", signalJson.getString("contractId"))
        assertEquals("answer", signalJson.getString("type"))
        assertEquals("reject", signalJson.getString("answer"))
    }

    @Test
    fun `reject signal does not include supportedFeatures`() {
        val payload = createPayload()

        val result = builder.buildRejectSignal(mockContext, payload)

        assertNotNull(result)
        val signalJson = JSONObject(result!!.getString(1))
        assertNull(signalJson.opt("supportedFeatures"))
    }

    @Test
    fun `accept returns null when userId is missing`() {
        every { mockCredentialsProvider.userId() } returns null
        val payload = createPayload()

        val result = builder.buildAcceptSignal(mockContext, payload)

        assertNull(result)
    }

    @Test
    fun `reject returns null when userId is missing`() {
        every { mockCredentialsProvider.userId() } returns null
        val payload = createPayload()

        val result = builder.buildRejectSignal(mockContext, payload)

        assertNull(result)
    }

    @Test
    fun `accept returns null when deviceId is empty`() {
        every { mockCredentialsProvider.deviceId() } returns ""
        val payload = createPayload()

        val result = builder.buildAcceptSignal(mockContext, payload)

        assertNull(result)
    }

    @Test
    fun `reject returns null when deviceId is empty`() {
        every { mockCredentialsProvider.deviceId() } returns ""
        val payload = createPayload()

        val result = builder.buildRejectSignal(mockContext, payload)

        assertNull(result)
    }
}
