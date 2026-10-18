package chat.rocket.reactnative.conference

import android.content.Context
import android.content.ContextWrapper
import android.content.res.Resources
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.Shadows.shadowOf
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [28])
class ConferenceCallServiceTest {

    // Unit tests run without the app's resource table, so the title and text are stubbed out.
    private val context: Context = object : ContextWrapper(RuntimeEnvironment.getApplication()) {
        private val stubbed = object : Resources(baseContext.assets, baseContext.resources.displayMetrics, baseContext.resources.configuration) {
            override fun getString(id: Int): String = "string $id"
        }

        override fun getResources(): Resources = stubbed
    }

    @Before
    fun setUp() {
        ConferenceCallService.stopService(context)
    }

    @After
    fun tearDown() {
        ConferenceCallService.stopService(context)
    }

    private fun actionTitles(): List<String> =
        ConferenceCallService.buildNotification(context).actions.orEmpty().map { it.title.toString() }

    @Test
    fun `has no buttons until the app has labelled them`() {
        assertNull(ConferenceCallService.buildNotification(context).actions)
    }

    @Test
    fun `offers to mute while the microphone is on, and to leave`() {
        ConferenceCallService.updateControls(context, true, "Mute", "Unmute", "Leave call")

        assertEquals(listOf("Mute", "Leave call"), actionTitles())
    }

    @Test
    fun `offers to unmute once the microphone is off`() {
        ConferenceCallService.updateControls(context, false, "Mute", "Unmute", "Leave call")

        assertEquals(listOf("Unmute", "Leave call"), actionTitles())
    }

    @Test
    fun `sends the mute button to the service as a toggle`() {
        ConferenceCallService.updateControls(context, true, "Mute", "Unmute", "Leave call")

        val button = shadowOf(ConferenceCallService.buildNotification(context).actions[0].actionIntent)

        assertTrue(button.isService)
        assertEquals(ConferenceCallService.ACTION_TOGGLE_MIC, button.savedIntent.action)
        assertEquals(ConferenceCallService::class.java.name, button.savedIntent.component?.className)
    }

    @Test
    fun `sends the leave button to the service as a leave`() {
        ConferenceCallService.updateControls(context, true, "Mute", "Unmute", "Leave call")

        val button = shadowOf(ConferenceCallService.buildNotification(context).actions[1].actionIntent)

        assertTrue(button.isService)
        assertEquals(ConferenceCallService.ACTION_LEAVE, button.savedIntent.action)
        assertEquals(ConferenceCallService::class.java.name, button.savedIntent.component?.className)
    }

    @Test
    fun `forgets the buttons when the service is stopped`() {
        ConferenceCallService.updateControls(context, true, "Mute", "Unmute", "Leave call")

        ConferenceCallService.stopService(context)

        assertNull(ConferenceCallService.buildNotification(context).actions)
    }

    @Test
    fun `posts nothing while no call is running`() {
        ConferenceCallService.updateControls(context, true, "Mute", "Unmute", "Leave call")

        val notifications = context.getSystemService(android.app.NotificationManager::class.java)
        assertEquals(0, shadowOf(notifications).size())
    }
}
