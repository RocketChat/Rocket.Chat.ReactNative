package chat.rocket.reactnative.biometric

import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyPermanentlyInvalidatedException
import android.security.keystore.KeyProperties
import android.util.Log

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext

import chat.rocket.reactnative.networking.NativeBiometricEnrollmentSpec

import java.security.KeyStore
import java.security.UnrecoverableKeyException

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
    NativeBiometricEnrollmentSpec(reactContext) {

    companion object {
        private const val TAG = "BiometricEnrollment"
        private const val KEYSTORE_PROVIDER = "AndroidKeyStore"
        private const val KEY_ALIAS = "rc_biometric_enrollment_probe"
        private const val TRANSFORMATION = "AES/GCM/NoPadding"
    }

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
    override fun enrollProbe(promise: Promise) {
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
    override fun disenrollProbe(promise: Promise) {
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
    override fun isEnrollmentValid(promise: Promise) {
        val keyStore: KeyStore
        try {
            keyStore = loadKeyStore()

            if (!keyStore.containsAlias(KEY_ALIAS)) {
                // The JS layer only calls this once biometry is enabled and the sentinel exists, so the
                // baseline should already be here. A missing alias means enrollProbe() silently failed or
                // the key was dropped out of lockstep — fail closed rather than self-heal to whatever the
                // current enrollment is.
                Log.w(TAG, "isEnrollmentValid: probe alias missing — treating as enrollment change")
                promise.resolve(false)
                return
            }
        } catch (e: Exception) {
            // Keystore provider itself is unavailable (getInstance/load/containsAlias) — an environmental
            // failure that says nothing about the probe key's validity. Fail open so a transient provider
            // error never forces the passcode on its own; the modal verify() path remains the backstop.
            Log.w(TAG, "isEnrollmentValid: keystore unavailable", e)
            promise.resolve(true)
            return
        }

        // Probe the key. Reporting "valid" requires a clean getKey() + init(); ANY failure in this region
        // is treated as a change (fail closed). A changed/invalidated enrollment does not always surface
        // as KeyPermanentlyInvalidatedException at init(): across OEMs / API levels / StrongBox it may be
        // an UnrecoverableKeyException or a generic KeyStoreException at getKey(), or another
        // InvalidKeyException at init(). Because this probe is the sole gate on a warm auto-lock unlock
        // (verify() never runs there), once the keystore is readable and the alias exists we never fail
        // open — the only path to "valid" is a fully successful probe.
        try {
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
        } catch (e: UnrecoverableKeyException) {
            // Some OEMs / API levels report an enrollment-invalidated key here rather than at init().
            Log.w(TAG, "probe key unrecoverable — treating as enrollment change", e)
            promise.resolve(false)
        } catch (e: Exception) {
            // getKey()/init() failed for some other reason (KeyStoreException, InvalidKeyException, a
            // provider glitch, …). A clean probe is the only proof the enrollment is unchanged, so treat
            // any failure here as a change rather than fail open.
            Log.w(TAG, "probe failed — treating as enrollment change", e)
            promise.resolve(false)
        }
    }
}
