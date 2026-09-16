package chat.rocket.reactnative.networking

import okhttp3.Request
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [28])
class SSLPinningTurboModuleTest {
    private lateinit var server: MockWebServer

    @Before
    fun setUp() {
        server = MockWebServer()
        server.start()
    }

    @After
    fun tearDown() {
        server.shutdown()
    }

    @Test
    fun `shared OkHttp client injects RC Mobile User-Agent when absent`() {
        server.enqueue(MockResponse().setBody("{}"))

        val client = SSLPinningTurboModule.getSharedOkHttpClient()
        val request = Request.Builder()
            .url(server.url("/api/v1/test"))
            .build()

        client.newCall(request).execute().use { response ->
            assertEquals(200, response.code)
        }

        val userAgent = server.takeRequest().getHeader("User-Agent")
        assertNotNull("User-Agent header must be present", userAgent)
        assertTrue(
            "User-Agent must start with 'RC Mobile' (got: $userAgent)",
            userAgent!!.startsWith("RC Mobile")
        )
    }

    @Test
    fun `shared OkHttp client preserves explicit User-Agent`() {
        server.enqueue(MockResponse().setBody("{}"))

        val client = SSLPinningTurboModule.getSharedOkHttpClient()
        val request = Request.Builder()
            .url(server.url("/api/v1/test"))
            .header("User-Agent", "Custom UA")
            .build()

        client.newCall(request).execute().use { response ->
            assertEquals(200, response.code)
        }

        assertEquals("Custom UA", server.takeRequest().getHeader("User-Agent"))
    }
}
