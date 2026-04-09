package chat.rocket.reactnative.voip.credentials

import android.content.Context
import android.provider.Settings
import chat.rocket.reactnative.notification.Ejson
import io.mockk.MockKAnnotations
import io.mockk.every
import io.mockk.impl.annotations.MockK
import io.mockk.mockk
import io.mockk.mockkObject
import io.mockk.mockkStatic
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Before
import org.junit.Test

class MMKVVoipCredentialsProviderTest {

    private lateinit var provider: MMKVVoipCredentialsProvider

    @MockK
    private lateinit var mockContext: Context

    @MockK
    private lateinit var mockContentResolver: android.content.ContentResolver

    private val testHost = "https://open.rocket.chat"
    private val testUserId = "testUserId123"
    private val testToken = "testToken456"
    private val testDeviceId = "android1234567890abcdef"

    @Before
    fun setup() {
        MockKAnnotations.init(this)
        mockkStatic(Settings.Secure::class)
        every { mockContext.contentResolver } returns mockContentResolver
        every {
            Settings.Secure.getString(mockContentResolver, Settings.Secure.ANDROID_ID)
        } returns testDeviceId
    }

    @Test
    fun `userId found returns userId from Ejson`() {
        val mockEjson = mockk<Ejson>()
        every { mockEjson.userId() } returns testUserId

        val provider = object : MMKVVoipCredentialsProvider(mockContext, testHost) {
            override fun createEjson(): Ejson = mockEjson
        }

        assertEquals(testUserId, provider.userId())
    }

    @Test
    fun `userId missing returns null`() {
        val mockEjson = mockk<Ejson>()
        every { mockEjson.userId() } returns ""

        val provider = object : MMKVVoipCredentialsProvider(mockContext, testHost) {
            override fun createEjson(): Ejson = mockEjson
        }

        assertNull(provider.userId())
    }

    @Test
    fun `token found returns token from Ejson`() {
        val mockEjson = mockk<Ejson>()
        every { mockEjson.token() } returns testToken

        val provider = object : MMKVVoipCredentialsProvider(mockContext, testHost) {
            override fun createEjson(): Ejson = mockEjson
        }

        assertEquals(testToken, provider.token())
    }

    @Test
    fun `token missing returns null`() {
        val mockEjson = mockk<Ejson>()
        every { mockEjson.token() } returns ""

        val provider = object : MMKVVoipCredentialsProvider(mockContext, testHost) {
            override fun createEjson(): Ejson = mockEjson
        }

        assertNull(provider.token())
    }

    @Test
    fun `deviceId from Settings Secure ANDROID_ID`() {
        val mockEjson = mockk<Ejson>()
        every { mockEjson.userId() } returns ""
        every { mockEjson.token() } returns ""

        val provider = object : MMKVVoipCredentialsProvider(mockContext, testHost) {
            override fun createEjson(): Ejson = mockEjson
        }

        assertEquals(testDeviceId, provider.deviceId())
    }

    @Test
    fun `all three values available`() {
        val mockEjson = mockk<Ejson>()
        every { mockEjson.userId() } returns testUserId
        every { mockEjson.token() } returns testToken

        val provider = object : MMKVVoipCredentialsProvider(mockContext, testHost) {
            override fun createEjson(): Ejson = mockEjson
        }

        assertEquals(testUserId, provider.userId())
        assertEquals(testToken, provider.token())
        assertEquals(testDeviceId, provider.deviceId())
    }
}
