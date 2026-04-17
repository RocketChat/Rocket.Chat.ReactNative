package chat.rocket.reactnative.voip

import org.junit.After
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

/**
 * Smoke coverage for [VoipModule] companion paths that do not require React Native JNI ([WritableMap]).
 * Cold-start [VoipModule.getInitialEvents] / full REST assertions belong in instrumentation tests (MMKV + SoLoader).
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34], application = VoipTestApplication::class)
class VoipModuleStaticTest {

    @After
    fun tearDown() {
        val ctx = StubReactApplicationContext(RuntimeEnvironment.getApplication())
        VoipModule.setReactContext(ctx)
        VoipModule(ctx).clearInitialEvents()
    }

    private fun isoUtcNow(): String {
        val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
        sdf.timeZone = TimeZone.getTimeZone("UTC")
        return sdf.format(Date())
    }

    private fun samplePayload(callId: String = "c1") = VoipPayload(
        callId = callId,
        caller = "Caller",
        username = "caller",
        host = "https://open.rocket.chat",
        type = VoipPushType.INCOMING_CALL.value,
        hostName = "Open",
        avatarUrl = null,
        createdAt = isoUtcNow(),
        voipAcceptFailed = false
    )

    @Test
    fun `storeInitialEvents and emitInitialEventsEvent do not throw when react instance inactive`() {
        val ctx = StubReactApplicationContext(RuntimeEnvironment.getApplication())
        VoipModule.setReactContext(ctx)
        VoipModule(ctx).clearInitialEvents()
        VoipModule.storeInitialEvents(samplePayload("s1"))
        VoipModule.emitInitialEventsEvent(samplePayload("s2"))
    }

    @Test
    fun `storeAcceptFailureForJs does not throw when react instance inactive`() {
        val ctx = StubReactApplicationContext(RuntimeEnvironment.getApplication())
        VoipModule.setReactContext(ctx)
        VoipModule(ctx).clearInitialEvents()
        VoipModule.storeAcceptFailureForJs(samplePayload("fail-1"))
    }
}
