package chat.rocket.reactnative.voip.signaling

import android.content.Context
import android.provider.Settings
import chat.rocket.reactnative.voip.VoipPayload
import chat.rocket.reactnative.voip.credentials.VoipCredentialsProvider
import io.mockk.MockKAnnotations
import io.mockk.every
import io.mockk.impl.annotations.MockK
import io.mockk.mockk
import io.mockk.mockkStatic
import io.mockk.slot
import io.mockk.verify
import android.util.Log
import org.json.JSONArray
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

    @MockK
    private lateinit var mockParamsBuilder: SignalParamsBuilder

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

    private fun mockParams(userId: String, signalJson: String): JSONArray {
        // Build a real JSONArray without calling put() — use JSONArray(String).
        // JSONArray(String) parses the string without invoking any put() native methods.
        return JSONArray("[\"$userId/media-calls\",\"${signalJson.replace("\"", "\\\"")}\"]")
    }

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

        // Default mock returns a well-formed JSONArray with the expected structure
        every {
            mockParamsBuilder.buildParams(
                userId = testUserId,
                callId = "call_abc",
                contractId = testDeviceId,
                answer = "accept",
                supportedFeatures = listOf("audio")
            )
        } returns mockParams("${testUserId}/media-calls", """{"callId":"call_abc","contractId":"device456","type":"answer","answer":"accept","supportedFeatures":["audio"]}""")

        every {
            mockParamsBuilder.buildParams(
                userId = testUserId,
                callId = "call_abc",
                contractId = testDeviceId,
                answer = "reject",
                supportedFeatures = null
            )
        } returns mockParams("${testUserId}/media-calls", """{"callId":"call_abc","contractId":"device456","type":"answer","answer":"reject"}""")

        builder = DefaultCallSignalBuilder(mockCredentialsProvider, mockParamsBuilder)
    }

    @Test
    fun `accept signal has correct JSON structure`() {
        val payload = createPayload()
        val signalJsonSlot = slot<String>()

        val result = builder.buildAcceptSignal(mockContext, payload)

        assertNotNull(result)
        verify {
            mockParamsBuilder.buildParams(
                userId = testUserId,
                callId = "call_abc",
                contractId = testDeviceId,
                answer = "accept",
                supportedFeatures = listOf("audio")
            )
        }
    }

    @Test
    fun `accept signal includes supportedFeatures only on accept`() {
        val payload = createPayload()

        val result = builder.buildAcceptSignal(mockContext, payload)

        assertNotNull(result)
        verify {
            mockParamsBuilder.buildParams(
                userId = testUserId,
                callId = "call_abc",
                contractId = testDeviceId,
                answer = "accept",
                supportedFeatures = listOf("audio")
            )
        }
    }

    @Test
    fun `reject signal has correct JSON structure`() {
        val payload = createPayload()

        val result = builder.buildRejectSignal(mockContext, payload)

        assertNotNull(result)
        verify {
            mockParamsBuilder.buildParams(
                userId = testUserId,
                callId = "call_abc",
                contractId = testDeviceId,
                answer = "reject",
                supportedFeatures = null
            )
        }
    }

    @Test
    fun `reject signal does not include supportedFeatures`() {
        val payload = createPayload()

        val result = builder.buildRejectSignal(mockContext, payload)

        assertNotNull(result)
        verify {
            mockParamsBuilder.buildParams(
                userId = testUserId,
                callId = "call_abc",
                contractId = testDeviceId,
                answer = "reject",
                supportedFeatures = null
            )
        }
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
