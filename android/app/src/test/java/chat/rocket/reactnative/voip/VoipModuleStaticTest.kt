package chat.rocket.reactnative.voip

import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config

/**
 * Smoke coverage for [VoipModule] companion paths that do not require React Native JNI ([WritableMap]).
 * Cold-start [VoipModule.getInitialEvents] and REST assertions need instrumentation (MMKV + SoLoader).
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34], application = VoipTestApplication::class)
class VoipModuleStaticTest {

    private lateinit var ctx: StubReactApplicationContext

    @Before
    fun prepareContext() {
        ctx = StubReactApplicationContext(RuntimeEnvironment.getApplication())
        VoipModule.setReactContext(ctx)
        VoipModule(ctx).clearInitialEvents()
    }

    @After
    fun tearDown() {
        VoipModule.setReactContext(ctx)
        VoipModule(ctx).clearInitialEvents()
    }

    /** Fixed UTC timestamp valid for [VoipPayload] parsing and well inside the incoming-call lifetime window. */
    private fun samplePayload(callId: String = "c1") = VoipPayload(
        callId = callId,
        caller = "Caller",
        username = "caller",
        host = "https://open.rocket.chat",
        type = VoipPushType.INCOMING_CALL.value,
        hostName = "Open",
        avatarUrl = null,
        createdAt = "2030-06-01T12:00:00.000Z",
        voipAcceptFailed = false
    )

    @Test
    fun `storeInitialEvents and emitInitialEventsEvent do not throw when react instance inactive`() {
        VoipModule.storeInitialEvents(samplePayload("s1"))
        VoipModule.emitInitialEventsEvent(samplePayload("s2"))
    }

    @Test
    fun `storeAcceptFailureForJs does not throw when react instance inactive`() {
        VoipModule.storeAcceptFailureForJs(samplePayload("fail-1"))
    }
}
