package chat.rocket.reactnative.conference

import android.app.Activity
import android.app.PictureInPictureParams
import android.content.pm.PackageManager
import android.os.Build
import android.util.Log
import android.util.Rational

object ConferencePictureInPicture {
    const val MODE_CHANGED_EVENT = "ConferencePictureInPictureChanged"

    private const val TAG = "RocketChat.ConferencePip"
    private const val ASPECT_WIDTH = 16
    private const val ASPECT_HEIGHT = 9

    @Volatile
    private var enabled = false

    @JvmStatic
    fun setEnabled(activity: Activity?, value: Boolean) {
        enabled = value
        if (activity != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && isSupported(activity)) {
            activity.setPictureInPictureParams(params(autoEnter = value))
        }
    }

    @JvmStatic
    fun enterOnUserLeaveHintBeforeAndroid12(activity: Activity) {
        if (enabled && Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
            enter(activity)
        }
    }

    @JvmStatic
    fun enter(activity: Activity?): Boolean {
        if (activity == null || !isSupported(activity) || activity.isInPictureInPictureMode) {
            return false
        }
        return try {
            activity.enterPictureInPictureMode(params(autoEnter = false))
        } catch (e: IllegalStateException) {
            Log.w(TAG, "enterPictureInPictureMode failed", e)
            false
        }
    }

    @JvmStatic
    fun notifyModeChanged(activity: Activity, isInPictureInPictureMode: Boolean) {
        ConferenceEvents.emit(activity, MODE_CHANGED_EVENT, isInPictureInPictureMode)
    }

    private fun isSupported(activity: Activity): Boolean =
        Build.VERSION.SDK_INT >= Build.VERSION_CODES.O &&
            activity.packageManager.hasSystemFeature(PackageManager.FEATURE_PICTURE_IN_PICTURE)

    private fun params(autoEnter: Boolean): PictureInPictureParams {
        val builder = PictureInPictureParams.Builder().setAspectRatio(Rational(ASPECT_WIDTH, ASPECT_HEIGHT))
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            builder.setAutoEnterEnabled(autoEnter)
        }
        return builder.build()
    }
}
