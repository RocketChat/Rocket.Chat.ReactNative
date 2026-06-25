package chat.rocket.reactnative.notification

import com.bumptech.glide.load.model.GlideUrl
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
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
