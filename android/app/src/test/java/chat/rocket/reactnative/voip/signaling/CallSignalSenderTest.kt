package chat.rocket.reactnative.voip.signaling

import android.content.Context
import android.provider.Settings
import chat.rocket.reactnative.voip.ddp.DdpClient
import chat.rocket.reactnative.voip.VoipPayload
import chat.rocket.reactnative.voip.VoipPerCallDdpRegistry
import chat.rocket.reactnative.voip.credentials.VoipCredentialsProvider
import io.mockk.MockKAnnotations
import io.mockk.every
import io.mockk.impl.annotations.MockK
import io.mockk.mockk
import io.mockk.mockkStatic
import android.util.Log
import io.mockk.slot
import io.mockk.verify
import org.json.JSONArray
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

class CallSignalSenderTest {

    private lateinit var sender: DefaultCallSignalSender

    @MockK
    private lateinit var mockContext: Context

    @MockK
    private lateinit var mockContentResolver: android.content.ContentResolver

    @MockK
    private lateinit var mockCredentialsProvider: VoipCredentialsProvider

    private lateinit var mockRegistry: VoipPerCallDdpRegistry<DdpClient>
    private lateinit var mockClient: DdpClient

    private val testHost = "https://open.rocket.chat"
    private val testUserId = "user123"
    private val testDeviceId = "device456"
    private val testToken = "token789"
    private val testCallId = "call_abc"

    private fun createPayload(): VoipPayload = VoipPayload(
        callId = testCallId,
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
        mockkStatic("android.util.Log")
        every { Log.d(any(), any()) } returns 0
        every { mockContext.contentResolver } returns mockContentResolver
        every {
            Settings.Secure.getString(mockContentResolver, Settings.Secure.ANDROID_ID)
        } returns testDeviceId

        every { mockCredentialsProvider.userId() } returns testUserId
        every { mockCredentialsProvider.token() } returns testToken
        every { mockCredentialsProvider.deviceId() } returns testDeviceId

        mockClient = mockk(relaxed = true)
        mockRegistry = mockk(relaxed = true)

        every { mockRegistry.clientFor(testCallId) } returns mockClient
        every { mockRegistry.isLoggedIn(testCallId) } returns true

        sender = DefaultCallSignalSender(mockRegistry, mockCredentialsProvider)
    }

    @Test
    fun `sendAccept calls callMethod when client exists and is logged in`() {
        val payload = createPayload()
        val acceptSlot = slot<(Boolean) -> Unit>()

        sender.sendAccept(mockContext, payload) { }

        verify { mockClient.callMethod(eq("stream-notify-user"), any(), capture(acceptSlot)) }
    }

    @Test
    fun `sendAccept does not call queueMethodCall`() {
        val payload = createPayload()

        sender.sendAccept(mockContext, payload) { }

        verify(exactly = 0) { mockClient.queueMethodCall(any(), any(), any()) }
    }

    @Test
    fun `sendAccept calls onComplete with false when client is null`() {
        every { mockRegistry.clientFor(testCallId) } returns null
        val payload = createPayload()
        var result = true

        sender.sendAccept(mockContext, payload) { success -> result = success }

        assertFalse(result)
    }

    @Test
    fun `queueAccept calls queueMethodCall when client exists`() {
        val payload = createPayload()

        sender.queueAccept(mockContext, payload) { }

        verify { mockClient.queueMethodCall(eq("stream-notify-user"), any(), any()) }
    }

    @Test
    fun `queueAccept does not call callMethod`() {
        val payload = createPayload()

        sender.queueAccept(mockContext, payload) { }

        verify(exactly = 0) { mockClient.callMethod(any(), any(), any()) }
    }

    @Test
    fun `queueAccept calls onComplete with false when client is null`() {
        every { mockRegistry.clientFor(testCallId) } returns null
        val payload = createPayload()
        var result = true

        sender.queueAccept(mockContext, payload) { success -> result = success }

        assertFalse(result)
    }

    @Test
    fun `sendReject calls callMethod when client exists`() {
        val payload = createPayload()

        sender.sendReject(mockContext, payload)

        verify { mockClient.callMethod(eq("stream-notify-user"), any(), any()) }
    }

    @Test
    fun `sendReject does not call queueMethodCall`() {
        val payload = createPayload()

        sender.sendReject(mockContext, payload)

        verify(exactly = 0) { mockClient.queueMethodCall(any(), any(), any()) }
    }

    @Test
    fun `queueReject calls queueMethodCall when client exists`() {
        val payload = createPayload()

        sender.queueReject(mockContext, payload)

        verify { mockClient.queueMethodCall(eq("stream-notify-user"), any(), any()) }
    }

    @Test
    fun `queueReject does not call callMethod`() {
        val payload = createPayload()

        sender.queueReject(mockContext, payload)

        verify(exactly = 0) { mockClient.callMethod(any(), any(), any()) }
    }

    @Test
    fun `flushPendingQueuedSignalsIfNeeded calls flushQueuedMethodCalls when client has queued calls`() {
        every { mockClient.hasQueuedMethodCalls() } returns true

        val flushed = sender.flushPendingQueuedSignalsIfNeeded(testCallId)

        assertTrue(flushed)
        verify { mockClient.flushQueuedMethodCalls() }
    }

    @Test
    fun `flushPendingQueuedSignalsIfNeeded returns false when no queued calls`() {
        every { mockClient.hasQueuedMethodCalls() } returns false

        val flushed = sender.flushPendingQueuedSignalsIfNeeded(testCallId)

        assertFalse(flushed)
        verify(exactly = 0) { mockClient.flushQueuedMethodCalls() }
    }

    @Test
    fun `flushPendingQueuedSignalsIfNeeded returns false when client is null`() {
        every { mockRegistry.clientFor(testCallId) } returns null

        val flushed = sender.flushPendingQueuedSignalsIfNeeded(testCallId)

        assertFalse(flushed)
    }
}
