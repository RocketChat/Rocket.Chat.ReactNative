package chat.rocket.reactnative

import android.app.Service
import android.content.Intent
import android.os.IBinder

/**
 * Minimal stub for a location foreground service.
 * We don't start it in the current app flow; this exists to satisfy
 * Android's requirement that FOREGROUND_SERVICE_LOCATION has a matching
 * service declaration. If started accidentally, stop immediately.
 */
class LocationService : Service() {
	override fun onBind(intent: Intent?): IBinder? = null

	override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
		// Not used in current implementation. Ensure we stop if invoked.
		stopSelf()
		return START_NOT_STICKY
	}
}
