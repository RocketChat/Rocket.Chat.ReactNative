package chat.rocket.reactnative.voip

import android.content.Context
import android.media.AudioDeviceInfo
import android.media.AudioManager
import android.os.Build
import android.util.Log
import chat.rocket.reactnative.BuildConfig
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.Arguments
import com.facebook.react.modules.core.DeviceEventManagerModule
import chat.rocket.reactnative.networking.NativeVoipSpec
import java.lang.ref.WeakReference
import java.util.concurrent.atomic.AtomicReference

/**
 * Native module to expose VoIP call data to JavaScript.
 * Used to retrieve pending VoIP call data when the app opens from a VoIP notification.
 */
class VoipModule(reactContext: ReactApplicationContext) : NativeVoipSpec(reactContext) {

    companion object {
        private const val TAG = "RocketChat.VoipModule"
        private const val EVENT_VOIP_ACCEPT_SUCCEEDED = "VoipAcceptSucceeded"
        private const val EVENT_VOIP_ACCEPT_FAILED = "VoipAcceptFailed"

        private var reactContextRef: WeakReference<ReactApplicationContext>? = null

        private val initialEventsData = AtomicReference<VoipPayload?>(null)

        /**
         * Sets the React context reference for event emission.
         */
        @JvmStatic
        fun setReactContext(context: ReactApplicationContext) {
            reactContextRef = WeakReference(context)
        }

        /**
         * Emits a VoIP call event to JavaScript when the app is running.
         */
        @JvmStatic
        fun emitInitialEventsEvent(voipPayload: VoipPayload) {
            try {
                reactContextRef?.get()?.let { context ->
                    if (context.hasActiveReactInstance()) {
                        context
                            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                            .emit(EVENT_VOIP_ACCEPT_SUCCEEDED, voipPayload.toWritableMap())
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to emit VoIP call event", e)
            }
        }

        /**
         * Stores VoIP call data for JS to retrieve.
         * Also emits an event if the app is running.
         */
        @JvmStatic
        fun storeInitialEvents(voipPayload: VoipPayload) {
            initialEventsData.set(voipPayload)
            emitInitialEventsEvent(voipPayload)
        }

        /**
         * Stash native accept failure for cold start [getInitialEvents] and emit [EVENT_VOIP_ACCEPT_FAILED] when JS is running.
         */
        @JvmStatic
        fun storeAcceptFailureForJs(payload: VoipPayload) {
            val failed = payload.copy(voipAcceptFailed = true)
            initialEventsData.set(failed)
            emitVoipAcceptFailedEvent(failed)
        }

        private fun emitVoipAcceptFailedEvent(voipPayload: VoipPayload) {
            try {
                reactContextRef?.get()?.let { context ->
                    if (context.hasActiveReactInstance()) {
                        context
                            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                            .emit(EVENT_VOIP_ACCEPT_FAILED, voipPayload.toWritableMap())
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to emit VoipAcceptFailed", e)
            }
        }

        @JvmStatic
        fun clearInitialEventsInternal() {
            try {
                initialEventsData.set(null)
                Log.d(TAG, "Cleared initial events")
            } catch (e: Exception) {
                Log.e(TAG, "Error clearing initial events", e)
            }
        }
    }

    private var communicationDeviceListener: AudioManager.OnCommunicationDeviceChangedListener? = null

    init {
        // Store reference for event emission
        setReactContext(reactApplicationContext)
    }

    /**
     * Gets any initial events.
     * Returns null if no initial events.
     */
    override fun getInitialEvents(): WritableMap? {
        while (true) {
            val data = initialEventsData.get() ?: return null

            if (data.isExpired()) {
                if (BuildConfig.DEBUG) {
                    Log.d(TAG, "Discarding expired VoIP initial event: ${data.callId}")
                }
                if (initialEventsData.compareAndSet(data, null)) {
                    return null
                }
                continue
            }

            val result = data.toWritableMap()
            if (initialEventsData.compareAndSet(data, null)) {
                return result
            }
        }
    }

    /**
     * Clears any initial events.
     */
    override fun clearInitialEvents() {
        clearInitialEventsInternal()
    }

    // No-op on Android - FCM handles push notifications
    override fun getLastVoipToken(): String = ""

    /**
     * Registers for VoIP push token.
     * No-op on Android - uses FCM for push notifications.
     */
    override fun registerVoipToken() {
        // No-op on Android - FCM handles push notifications
        Log.d(TAG, "registerVoipToken called (no-op on Android)")
    }

    override fun stopNativeDDPClient() {
        Log.d(TAG, "stopNativeDDPClient called, stopping native DDP client")
        VoipNotification.stopDDPClient()
    }

    override fun stopVoipCallService() {
        try {
            VoipCallService.stopService(reactApplicationContext)
            Log.d(TAG, "stopVoipCallService: service stopped")
        } catch (e: Exception) {
            Log.e(TAG, "stopVoipCallService: failed to stop service", e)
        }
    }

    override fun startAudioRouteSync(promise: Promise) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
            promise.resolve(null)
            return
        }
        if (communicationDeviceListener != null) {
            promise.resolve(null)
            return
        }
        val audioManager = reactApplicationContext.getSystemService(AudioManager::class.java)
        val listener = AudioManager.OnCommunicationDeviceChangedListener { device ->
            val isSpeaker = device?.type == AudioDeviceInfo.TYPE_BUILTIN_SPEAKER
            emitCommunicationDeviceChanged(isSpeaker)
        }
        audioManager.addOnCommunicationDeviceChangedListener(reactApplicationContext.mainExecutor, listener)
        communicationDeviceListener = listener

        // addOnCommunicationDeviceChangedListener does not invoke the callback on registration,
        // so seed the JS-side state with the current device.
        val currentDevice = audioManager.communicationDevice
        if (currentDevice != null) {
            val isSpeaker = currentDevice.type == AudioDeviceInfo.TYPE_BUILTIN_SPEAKER
            emitCommunicationDeviceChanged(isSpeaker)
        }

        promise.resolve(null)
    }

    override fun stopAudioRouteSync(promise: Promise) {
        val listener = communicationDeviceListener
        if (listener != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val audioManager = reactApplicationContext.getSystemService(AudioManager::class.java)
            audioManager.removeOnCommunicationDeviceChangedListener(listener)
        }
        communicationDeviceListener = null
        promise.resolve(null)
    }

    private fun emitCommunicationDeviceChanged(isSpeaker: Boolean) {
        try {
            reactContextRef?.get()?.let { context ->
                if (context.hasActiveReactInstance()) {
                    val params = Arguments.createMap().apply { putBoolean("isSpeaker", isSpeaker) }
                    context
                        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                        .emit("VoipCommunicationDeviceChanged", params)
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to emit VoipCommunicationDeviceChanged", e)
        }
    }

    /**
     * Routes call audio between the device speakerphone and the system-chosen output (earpiece/headset).
     *
     * The app's Telecom PhoneAccount is self-managed, so Connection.setAudioRoute() is a no-op —
     * the app owns audio routing and must drive AudioManager directly.
     *
     * API 31+: setCommunicationDevice(BUILTIN_SPEAKER) preempts WebRTC's AudioDeviceModule routing race.
     * Pre-31: legacy MODE_IN_COMMUNICATION + setSpeakerphoneOn fallback.
     */
    override fun setSpeakerOn(on: Boolean, promise: Promise) {
        try {
            val audioManager = reactApplicationContext.getSystemService(Context.AUDIO_SERVICE) as AudioManager
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                if (on) {
                    val speaker = audioManager.availableCommunicationDevices
                        .firstOrNull { it.type == AudioDeviceInfo.TYPE_BUILTIN_SPEAKER }
                    if (speaker == null) {
                        Log.w(TAG, "setSpeakerOn: no BUILTIN_SPEAKER in availableCommunicationDevices")
                        promise.resolve(false)
                        return
                    }
                    val ok = audioManager.setCommunicationDevice(speaker)
                    Log.d(TAG, "setSpeakerOn(true) via setCommunicationDevice -> $ok")
                    promise.resolve(ok)
                } else {
                    audioManager.clearCommunicationDevice()
                    Log.d(TAG, "setSpeakerOn(false) via clearCommunicationDevice")
                    promise.resolve(true)
                }
            } else {
                @Suppress("DEPRECATION")
                audioManager.mode = AudioManager.MODE_IN_COMMUNICATION
                @Suppress("DEPRECATION")
                audioManager.isSpeakerphoneOn = on
                Log.d(TAG, "setSpeakerOn($on) via legacy setSpeakerphoneOn")
                promise.resolve(true)
            }
        } catch (e: Exception) {
            Log.e(TAG, "setSpeakerOn failed", e)
            promise.reject("E_AUDIO_ROUTE", e.message, e)
        }
    }

    /**
     * Required for NativeEventEmitter in TurboModules.
     * Called when JS starts listening to events.
     */
    override fun addListener(eventName: String) {
        // Keep track of listeners if needed
        if (BuildConfig.DEBUG) {
            Log.d(TAG, "addListener: $eventName")
        }
    }

    /**
     * Required for NativeEventEmitter in TurboModules.
     * Called when JS stops listening to events.
     */
    override fun removeListeners(count: Double) {
        // Remove listeners if needed
        Log.d(TAG, "removeListeners: $count")
    }
}
