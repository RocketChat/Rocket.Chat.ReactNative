package chat.rocket.reactnative.biometric

import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyPermanentlyInvalidatedException
import android.security.keystore.KeyProperties
import android.util.Log

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

import java.security.KeyStore

import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey

/**
 * Silent biometric enrollment-change detection for Android.
 *
 * iOS gets this for free: a BIOMETRY_CURRENT_SET keychain item is dropped by the OS when the
 * enrollment set changes, so the JS trust store's cheap existence check reveals it without a prompt.
 * Android's keystore key is NOT deleted on an enrollment change — it is only invalidated, and that
 * invalidation surfaces as a KeyPermanentlyInvalidatedException the first time the key is *used*.
 * react-native-keychain only exposes a combined init+doFinal read, which shows the BiometricPrompt
 * for a still-valid key, so it cannot serve as a silent probe.
 *
 * This module keeps a dedicated AES key bound to the current enrollment
 * (setInvalidatedByBiometricEnrollment = true). Calling Cipher.init() on it is silent: it succeeds
 * for a valid enrollment (no prompt — auth is only enforced at doFinal, which we never call) and
 * throws KeyPermanentlyInvalidatedException once the enrollment has changed. The key is created in
 * lockstep with the JS trust sentinel (enroll/disenroll) and lazily (re)created on first check, so
 * existing biometry users get a baseline without being forced through a passcode on upgrade.
 */
class BiometricEnrollmentModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val TAG = "BiometricEnrollment"
        private const val KEYSTORE_PROVIDER = "AndroidKeyStore"
        private const val KEY_ALIAS = "rc_biometric_enrollment_probe"
        private const val TRANSFORMATION = "AES/GCM/NoPadding"
    }

    override fun getName(): String = "BiometricEnrollment"

    private fun loadKeyStore(): KeyStore = KeyStore.getInstance(KEYSTORE_PROVIDER).apply { load(null) }

    private fun createProbeKey() {
        val keyGenerator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, KEYSTORE_PROVIDER)
        keyGenerator.init(
            KeyGenParameterSpec.Builder(
                KEY_ALIAS,
                KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT
            )
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setKeySize(256)
                .setUserAuthenticationRequired(true)
                // The whole point: the OS invalidates this key when the biometric enrollment changes.
                .setInvalidatedByBiometricEnrollment(true)
                .build()
        )
        keyGenerator.generateKey()
    }

    /** Create the probe key bound to the current enrollment (idempotent). */
    @ReactMethod
    fun enrollProbe(promise: Promise) {
        try {
            val keyStore = loadKeyStore()
            if (!keyStore.containsAlias(KEY_ALIAS)) {
                createProbeKey()
            }
            promise.resolve(true)
        } catch (e: Exception) {
            // Creating the probe needs a current biometric enrollment + secure lock screen. If that's
            // missing the JS layer simply won't have a probe; the modal verify() path stays as backstop.
            Log.w(TAG, "enrollProbe failed", e)
            promise.resolve(false)
        }
    }

    /** Delete the probe key, kept in lockstep with the JS trust sentinel teardown. */
    @ReactMethod
    fun disenrollProbe(promise: Promise) {
        try {
            val keyStore = loadKeyStore()
            if (keyStore.containsAlias(KEY_ALIAS)) {
                keyStore.deleteEntry(KEY_ALIAS)
            }
            promise.resolve(true)
        } catch (e: Exception) {
            Log.w(TAG, "disenrollProbe failed", e)
            promise.resolve(false)
        }
    }

    /**
     * Silent check. Resolves true when the current enrollment still matches the probe key (or the
     * probe was just created as a fresh baseline), false only when the key was invalidated by an
     * enrollment change. Never shows a biometric prompt.
     */
    @ReactMethod
    fun isEnrollmentValid(promise: Promise) {
        try {
            val keyStore = loadKeyStore()

            if (!keyStore.containsAlias(KEY_ALIAS)) {
                // No baseline yet (fresh install/upgrade, or just disenrolled). Establish one bound to
                // the current enrollment and report valid — there is no prior enrollment to differ from.
                try {
                    createProbeKey()
                    promise.resolve(true)
                } catch (e: Exception) {
                    // Couldn't bind a baseline — most likely biometrics were removed entirely. Treat as
                    // a change so the passcode is required.
                    Log.w(TAG, "isEnrollmentValid: probe baseline creation failed", e)
                    promise.resolve(false)
                }
                return
            }

            val key = keyStore.getKey(KEY_ALIAS, null) as? SecretKey
            if (key == null) {
                promise.resolve(false)
                return
            }

            val cipher = Cipher.getInstance(TRANSFORMATION)
            // init() does NOT prompt and does NOT run crypto; it only fails if the key was invalidated.
            cipher.init(Cipher.ENCRYPT_MODE, key)
            promise.resolve(true)
        } catch (e: KeyPermanentlyInvalidatedException) {
            promise.resolve(false)
        } catch (e: Exception) {
            // Unknown keystore failure: fail open to avoid nagging the user on transient errors. The
            // modal-based verify() remains the backstop for a real enrollment change.
            Log.w(TAG, "isEnrollmentValid failed", e)
            promise.resolve(true)
        }
    }
}
