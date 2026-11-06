package chat.rocket.reactnative.conference

import android.content.Context
import android.content.ContextWrapper
import android.content.res.Resources
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
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

    private val contextWithStubbedStrings: Context = object : ContextWrapper(RuntimeEnvironment.getApplication()) {
        private val stubbedResources = object : Resources(
            baseContext.assets,
            baseContext.resources.displayMetrics,
            baseContext.resources.configuration
        ) {
            override fun getString(id: Int): String = "string $id"
        }

        override fun getResources(): Resources = stubbedResources
    }

    private fun controls(micEnabled: Boolean) =
        ConferenceCallService.Controls(micEnabled, "Mute", "Unmute", "Leave call")

    @Before
    fun setUp() {
        ConferenceCallService.stopService(contextWithStubbedStrings)
    }

    @After
    fun tearDown() {
        ConferenceCallService.stopService(contextWithStubbedStrings)
    }

    private fun actionTitles(): List<String> =
        ConferenceCallService.buildNotification(contextWithStubbedStrings).actions.orEmpty().map { it.title.toString() }

    private fun action(index: Int) = ConferenceCallService.buildNotification(contextWithStubbedStrings).actions[index]

    @Test
    fun `has no buttons until the app has labelled them`() {
        assertNull(ConferenceCallService.buildNotification(contextWithStubbedStrings).actions)
    }

    @Test
    fun `offers to mute while the microphone is on, and to leave`() {
        ConferenceCallService.updateControls(contextWithStubbedStrings, controls(micEnabled = true))

        assertEquals(listOf("Mute", "Leave call"), actionTitles())
    }

    @Test
    fun `offers to unmute once the microphone is off`() {
        ConferenceCallService.updateControls(contextWithStubbedStrings, controls(micEnabled = false))

        assertEquals(listOf("Unmute", "Leave call"), actionTitles())
    }

    @Test
    fun `sends the mute button to the service as a mute, never an unmute`() {
        ConferenceCallService.updateControls(contextWithStubbedStrings, controls(micEnabled = true))

        val button = shadowOf(action(0).actionIntent)

        assertTrue(button.isService)
        assertEquals(ConferenceCallService.ACTION_MUTE, button.savedIntent.action)
        assertEquals(ConferenceCallService::class.java.name, button.savedIntent.component?.className)
    }

    @Test
    fun `sends the unmute button to the service as an unmute, never a mute`() {
        ConferenceCallService.updateControls(contextWithStubbedStrings, controls(micEnabled = false))

        val button = shadowOf(action(0).actionIntent)

        assertTrue(button.isService)
        assertEquals(ConferenceCallService.ACTION_UNMUTE, button.savedIntent.action)
        assertEquals(ConferenceCallService::class.java.name, button.savedIntent.component?.className)
    }

    @Test
    fun `sends the leave button to the service as a leave`() {
        ConferenceCallService.updateControls(contextWithStubbedStrings, controls(micEnabled = true))

        val button = shadowOf(action(1).actionIntent)

        assertTrue(button.isService)
        assertEquals(ConferenceCallService.ACTION_LEAVE, button.savedIntent.action)
        assertEquals(ConferenceCallService::class.java.name, button.savedIntent.component?.className)
    }

    @Test
    fun `passes a mute on even while the device is locked`() {
        assertEquals("mute", ConferenceCallService.notificationEvent(ConferenceCallService.ACTION_MUTE, deviceLocked = true))
    }

    @Test
    fun `passes a leave on even while the device is locked`() {
        assertEquals("leave", ConferenceCallService.notificationEvent(ConferenceCallService.ACTION_LEAVE, deviceLocked = true))
    }

    @Test
    fun `drops an unmute pressed while the device is locked`() {
        assertNull(ConferenceCallService.notificationEvent(ConferenceCallService.ACTION_UNMUTE, deviceLocked = true))
    }

    @Test
    fun `passes an unmute on once the device is unlocked`() {
        assertEquals("unmute", ConferenceCallService.notificationEvent(ConferenceCallService.ACTION_UNMUTE, deviceLocked = false))
    }

    @Test
    fun `ignores an action it does not know`() {
        assertNull(ConferenceCallService.notificationEvent("chat.rocket.reactnative.conference.START_SERVICE", deviceLocked = false))
        assertNull(ConferenceCallService.notificationEvent(null, deviceLocked = false))
    }

    @Test
    @Config(sdk = [35])
    fun `asks for the device to be unlocked before unmuting`() {
        ConferenceCallService.updateControls(contextWithStubbedStrings, controls(micEnabled = false))

        assertTrue(action(0).isAuthenticationRequired)
    }

    @Test
    @Config(sdk = [35])
    fun `lets the microphone be muted and the call left from the lock screen`() {
        ConferenceCallService.updateControls(contextWithStubbedStrings, controls(micEnabled = true))

        assertFalse(action(0).isAuthenticationRequired)
        assertFalse(action(1).isAuthenticationRequired)
    }

    @Test
    fun `forgets the buttons when the service is stopped`() {
        ConferenceCallService.updateControls(contextWithStubbedStrings, controls(micEnabled = true))

        ConferenceCallService.stopService(contextWithStubbedStrings)

        assertNull(ConferenceCallService.buildNotification(contextWithStubbedStrings).actions)
    }

    @Test
    fun `posts nothing while no call is running`() {
        ConferenceCallService.updateControls(contextWithStubbedStrings, controls(micEnabled = true))

        val notifications = contextWithStubbedStrings.getSystemService(android.app.NotificationManager::class.java)
        assertEquals(0, shadowOf(notifications).size())
    }
}
