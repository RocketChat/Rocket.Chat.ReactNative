package chat.rocket.reactnative.conference

import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import android.os.SystemClock
import android.util.Log
import com.facebook.react.bridge.ReactApplicationContext
import kotlin.math.sqrt

object ConferenceMicLevelMonitor {
    const val LEVEL_EVENT = "ConferenceMicLevel"

    private const val TAG = "RocketChat.ConferenceMicLevel"
    private const val SAMPLE_RATE = 16000
    private const val READ_SAMPLES = SAMPLE_RATE / 50
    private const val REPORT_INTERVAL_MS = 100L
    private const val STOP_WAIT_MS = 500L
    private const val PCM_MAX = 32768.0

    @Volatile
    private var worker: Thread? = null

    @JvmStatic
    @Synchronized
    fun start(context: ReactApplicationContext): Boolean {
        if (worker != null) {
            return true
        }
        if (!ConferenceCallService.hasMicrophonePermission(context)) {
            return false
        }
        val record = createRecord() ?: return false
        try {
            record.startRecording()
        } catch (e: IllegalStateException) {
            Log.w(TAG, "startRecording failed", e)
            record.release()
            return false
        }
        val thread = Thread({ readLevels(context, record) }, "ConferenceMicLevelMonitor")
        worker = thread
        thread.start()
        return true
    }

    @JvmStatic
    @Synchronized
    fun stop() {
        val thread = worker ?: return
        worker = null
        thread.join(STOP_WAIT_MS)
    }

    private fun createRecord(): AudioRecord? {
        val bufferBytes = AudioRecord.getMinBufferSize(SAMPLE_RATE, AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT)
        if (bufferBytes <= 0) {
            return null
        }
        val record = try {
            AudioRecord(
                MediaRecorder.AudioSource.MIC,
                SAMPLE_RATE,
                AudioFormat.CHANNEL_IN_MONO,
                AudioFormat.ENCODING_PCM_16BIT,
                bufferBytes * 2
            )
        } catch (e: Exception) {
            Log.w(TAG, "AudioRecord could not be created", e)
            return null
        }
        if (record.state != AudioRecord.STATE_INITIALIZED) {
            record.release()
            return null
        }
        return record
    }

    private fun readLevels(context: ReactApplicationContext, record: AudioRecord) {
        val self = Thread.currentThread()
        val buffer = ShortArray(READ_SAMPLES)
        var sumOfSquares = 0.0
        var samples = 0
        var lastReport = SystemClock.elapsedRealtime()
        try {
            while (worker === self) {
                val read = record.read(buffer, 0, buffer.size)
                if (read < 0) {
                    break
                }
                for (index in 0 until read) {
                    val sample = buffer[index] / PCM_MAX
                    sumOfSquares += sample * sample
                }
                samples += read
                val now = SystemClock.elapsedRealtime()
                if (samples > 0 && now - lastReport >= REPORT_INTERVAL_MS) {
                    ConferenceEvents.emit(context, LEVEL_EVENT, sqrt(sumOfSquares / samples))
                    sumOfSquares = 0.0
                    samples = 0
                    lastReport = now
                }
            }
        } finally {
            try {
                record.stop()
            } catch (e: IllegalStateException) {
                Log.w(TAG, "stop failed", e)
            }
            record.release()
            if (worker === self) {
                worker = null
            }
        }
    }
}
