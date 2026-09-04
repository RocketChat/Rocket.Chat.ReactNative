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

/** Silent biometric enrollment-change detection for Android. See docs/PLATFORMS.md. */
class BiometricEnrollmentModule(reactContext: ReactApplicationContext) :
    NativeBiometricEnrollmentSpec(reactContext) {

    companion object {
        private const val TAG = "BiometricEnrollment"
        private const val KEYSTORE_PROVIDER = "AndroidKeyStore"
        // Alias is frozen: renaming it orphans every existing key, and isEnrollmentValid fails closed
        // on the missing alias — one spurious passcode for every Android user with biometry on.
        private const val KEY_ALIAS = "rc_biometric_enrollment_probe"
        private const val TRANSFORMATION = "AES/GCM/NoPadding"
    }

    private fun loadKeyStore(): KeyStore = KeyStore.getInstance(KEYSTORE_PROVIDER).apply { load(null) }

    private fun createEnrollmentKey() {
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
                .setInvalidatedByBiometricEnrollment(true)
                .build()
        )
        keyGenerator.generateKey()
    }

    /** Create the enrollment key bound to the current enrollment (idempotent). */
    override fun bindEnrollmentKey(promise: Promise) {
        try {
            val keyStore = loadKeyStore()
            if (!keyStore.containsAlias(KEY_ALIAS)) {
                createEnrollmentKey()
            }
            promise.resolve(true)
        } catch (e: Exception) {
            // Needs a current enrollment + secure lock screen; the JS caller refuses to enable biometry.
            Log.w(TAG, "bindEnrollmentKey failed", e)
            promise.resolve(false)
        }
    }

    /** Delete the enrollment key, kept in lockstep with the JS trust sentinel teardown. */
    override fun clearEnrollmentKey(promise: Promise) {
        try {
            val keyStore = loadKeyStore()
            if (keyStore.containsAlias(KEY_ALIAS)) {
                keyStore.deleteEntry(KEY_ALIAS)
            }
            promise.resolve(true)
        } catch (e: Exception) {
            Log.w(TAG, "clearEnrollmentKey failed", e)
            promise.resolve(false)
        }
    }

    /** Silent, never creates a key: only a clean check of an existing key resolves true. */
    override fun isEnrollmentValid(promise: Promise) {
        val keyStore: KeyStore
        try {
            keyStore = loadKeyStore()
        } catch (e: Exception) {
            // Provider unavailable says nothing about the key's validity, so fail open here only.
            Log.w(TAG, "isEnrollmentValid: keystore unavailable", e)
            promise.resolve(true)
            return
        }

        // Sole gate on a warm unlock, and OEMs report invalidation inconsistently: any failure is a change.
        try {
            if (!keyStore.containsAlias(KEY_ALIAS)) {
                // Fail closed rather than self-heal a baseline onto the current enrollment.
                Log.w(TAG, "isEnrollmentValid: enrollment key alias missing — treating as enrollment change")
                promise.resolve(false)
                return
            }

            val key = keyStore.getKey(KEY_ALIAS, null) as? SecretKey
            if (key == null) {
                promise.resolve(false)
                return
            }

            val cipher = Cipher.getInstance(TRANSFORMATION)
            // init() neither prompts nor runs crypto; it only fails if the key was invalidated.
            cipher.init(Cipher.ENCRYPT_MODE, key)
            promise.resolve(true)
        } catch (e: KeyPermanentlyInvalidatedException) {
            promise.resolve(false)
        } catch (e: UnrecoverableKeyException) {
            // Some OEMs report an enrollment-invalidated key here rather than at init().
            Log.w(TAG, "enrollment key unrecoverable — treating as enrollment change", e)
            promise.resolve(false)
        } catch (e: Exception) {
            Log.w(TAG, "enrollment check failed — treating as enrollment change", e)
            promise.resolve(false)
        }
    }
}
