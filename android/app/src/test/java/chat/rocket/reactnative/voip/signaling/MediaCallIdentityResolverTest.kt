package chat.rocket.reactnative.voip.signaling

import android.content.Context
import android.provider.Settings
import chat.rocket.reactnative.voip.VoipPayload
import chat.rocket.reactnative.voip.credentials.VoipCredentialsProvider
import io.mockk.MockKAnnotations
import io.mockk.every
import io.mockk.impl.annotations.MockK
import io.mockk.mockkStatic
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Before
import org.junit.Test

class MediaCallIdentityResolverTest {

    @MockK
    private lateinit var mockContext: Context

    @MockK
    private lateinit var mockContentResolver: android.content.ContentResolver

    @MockK
    private lateinit var mockCredentialsProvider: VoipCredentialsProvider

    private lateinit var resolver: DefaultMediaCallIdentityResolver

    private val testHost = "https://open.rocket.chat"
    private val testDeviceId = "android1234567890abcdef"

    private fun makePayload(host: String = testHost): VoipPayload = VoipPayload(
        callId = "call-123",
        caller = "caller-name",
        username = "caller-username",
        host = host,
        type = "incoming_call",
        hostName = "Rocket.Chat",
        avatarUrl = null,
        createdAt = "2026-04-09T10:00:00.000Z"
    )

    @Before
    fun setup() {
        MockKAnnotations.init(this)
        mockkStatic(Settings.Secure::class)
        every { mockContext.contentResolver } returns mockContentResolver
        every {
            Settings.Secure.getString(mockContentResolver, Settings.Secure.ANDROID_ID)
        } returns testDeviceId
        resolver = DefaultMediaCallIdentityResolver(mockCredentialsProvider)
    }

    @Test
    fun `resolveIdentity - returns identity when all values present`() {
        // Given
        val payload = makePayload()
        every { mockCredentialsProvider.userId() } returns "user-abc"
        every { mockCredentialsProvider.token() } returns "token-xyz"
        every { mockCredentialsProvider.deviceId() } returns testDeviceId

        // When
        val result = resolver.resolveIdentity(mockContext, payload)

        // Then
        assertEquals("user-abc", result?.userId)
        assertEquals(testDeviceId, result?.deviceId)
    }

    @Test
    fun `resolveIdentity - returns null when userId is missing`() {
        // Given
        val payload = makePayload()
        every { mockCredentialsProvider.userId() } returns null
        every { mockCredentialsProvider.token() } returns "token-xyz"
        every { mockCredentialsProvider.deviceId() } returns testDeviceId

        // When
        val result = resolver.resolveIdentity(mockContext, payload)

        // Then
        assertNull(result)
    }

    @Test
    fun `resolveIdentity - returns null when deviceId is missing`() {
        // Given
        val payload = makePayload()
        every { mockCredentialsProvider.userId() } returns "user-abc"
        every { mockCredentialsProvider.token() } returns "token-xyz"
        every { mockCredentialsProvider.deviceId() } returns ""

        // When
        val result = resolver.resolveIdentity(mockContext, payload)

        // Then
        assertNull(result)
    }

    @Test
    fun `resolveIdentity - returns null when both userId and deviceId are missing`() {
        // Given
        val payload = makePayload()
        every { mockCredentialsProvider.userId() } returns null
        every { mockCredentialsProvider.token() } returns null
        every { mockCredentialsProvider.deviceId() } returns ""

        // When
        val result = resolver.resolveIdentity(mockContext, payload)

        // Then
        assertNull(result)
    }

    @Test
    fun `resolveIdentity - token is not required for identity resolution`() {
        // Given — token is null but userId and deviceId are present
        val payload = makePayload()
        every { mockCredentialsProvider.userId() } returns "user-abc"
        every { mockCredentialsProvider.token() } returns null
        every { mockCredentialsProvider.deviceId() } returns testDeviceId

        // When
        val result = resolver.resolveIdentity(mockContext, payload)

        // Then
        assertEquals("user-abc", result?.userId)
        assertEquals(testDeviceId, result?.deviceId)
    }
}