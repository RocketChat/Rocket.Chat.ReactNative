package chat.rocket.reactnative.notification

import com.bumptech.glide.load.model.GlideUrl
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/**
 * Regression tests for [NotificationHelper.avatarLoadModel].
 *
 * Issue #7330: Android push notifications were fetching avatars without the
 * app's "RC Mobile" User-Agent, surfacing the default Dalvik UA in server logs.
 * The avatar loader must always attach the User-Agent header, regardless of
 * whether auth credentials are present.
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [28])
class NotificationHelperTest {

    @Test
    fun `avatarLoadModel includes RC Mobile User-Agent when ejson is null`() {
        val loadModel = NotificationHelper.avatarLoadModel("https://example.com/avatar/foo", null)

        assertTrue("Expected GlideUrl, got ${loadModel?.javaClass}", loadModel is GlideUrl)
        val headers = (loadModel as GlideUrl).headers
        val userAgent = headers["User-Agent"]
        assertNotNull("User-Agent header must be present", userAgent)
        assertTrue(
            "User-Agent must start with 'RC Mobile' (got: $userAgent)",
            userAgent!!.startsWith("RC Mobile")
        )
    }

    @Test
    fun `avatarLoadModel sends credentials as encoded query params and keys the cache by rc_uid without rc_token`() {
        val ejson = object : Ejson() {
            override fun token() = "a+b/c"
            override fun userId() = "uid1"
        }

        val loadModel = NotificationHelper.avatarLoadModel("https://example.com/avatar/foo?format=png&size=100", ejson)

        assertTrue("Expected GlideUrl, got ${loadModel?.javaClass}", loadModel is GlideUrl)
        val glideUrl = loadModel as GlideUrl
        assertEquals(
            "https://example.com/avatar/foo?format=png&size=100&rc_uid=uid1&rc_token=a%2Bb%2Fc",
            glideUrl.toStringUrl()
        )
        assertEquals("https://example.com/avatar/foo?format=png&size=100&rc_uid=uid1", glideUrl.cacheKey)
        assertNull(glideUrl.headers["rc_token"])
        assertNull(glideUrl.headers["rc_uid"])
        assertNotNull(glideUrl.headers["User-Agent"])
    }

    @Test
    fun `avatarLoadModel adds no credentials when token or userId is empty`() {
        val uri = "https://example.com/avatar/foo?format=png&size=100"
        val noToken = object : Ejson() {
            override fun token() = ""
            override fun userId() = "uid1"
        }
        val noUserId = object : Ejson() {
            override fun token() = "token1"
            override fun userId() = ""
        }

        listOf(noToken, noUserId).forEach { ejson ->
            val glideUrl = NotificationHelper.avatarLoadModel(uri, ejson) as GlideUrl
            assertEquals(uri, glideUrl.toStringUrl())
            assertEquals(uri, glideUrl.cacheKey)
            assertNull(glideUrl.headers["rc_token"])
            assertNull(glideUrl.headers["rc_uid"])
        }
    }

    @Test
    fun `avatarLoadModel returns input unchanged when uri is null or empty`() {
        assertEquals(null, NotificationHelper.avatarLoadModel(null, null))
        assertEquals("", NotificationHelper.avatarLoadModel("", null))
    }

    @Test
    fun `getUserAgent matches RC Mobile android format`() {
        val ua = NotificationHelper.getUserAgent()
        assertTrue(
            "User-Agent should match 'RC Mobile; android <ver>; v<name> (<code>)' (got: $ua)",
            Regex("^RC Mobile; android [^;]+; v[^ ]+ \\(\\d+\\)$").matches(ua)
        )
    }
}
