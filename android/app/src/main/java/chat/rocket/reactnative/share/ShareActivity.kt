package chat.rocket.reactnative.share

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Parcelable
import android.provider.OpenableColumns
import android.util.Log
import androidx.appcompat.app.AppCompatActivity
import java.io.File
import java.io.FileOutputStream
import java.io.InputStream
import java.util.*

class ShareActivity : AppCompatActivity() {

    private val appScheme = "rocketchat"

    private val maxTextLength = 32000

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        cleanupSharedDir()
        handleIntent(intent)
    }

    private fun handleIntent(intent: Intent?) {
        // Check if the intent contains shared content
        if (intent?.action == Intent.ACTION_SEND || intent?.action == Intent.ACTION_SEND_MULTIPLE) {
            when {
                intent.type?.startsWith("text/") == true -> handleText(intent)
                intent.type?.startsWith("image/") == true -> handleMedia(intent)
                intent.type?.startsWith("video/") == true -> handleMedia(intent)
                intent.type?.startsWith("audio/") == true -> handleMedia(intent)
                intent.type?.startsWith("application/") == true -> handleMedia(intent)
                intent.type == "*/*" -> handleMedia(intent)
                else -> completeRequest() // No matching type, complete the request
            }
        } else {
            completeRequest() // No relevant intent action, complete the request
        }
    }

    private fun handleText(intent: Intent) {
        // Contacts share as text/* (e.g. text/x-vcard) with the payload in
        // EXTRA_STREAM, not EXTRA_TEXT — handle it as media.
        if (intent.hasExtra(Intent.EXTRA_STREAM)) {
            handleMedia(intent)
            return
        }
        // Handle sharing text
        val sharedText = intent.getStringExtra(Intent.EXTRA_TEXT)
        if (sharedText != null) {
            if (sharedText.length > maxTextLength) {
                val ext = if (intent.type == "text/html") ".html" else ".txt"
                val fileUri = saveDataToCacheDir(sharedText.toByteArray(Charsets.UTF_8), "shared-${UUID.randomUUID()}$ext")
                if (fileUri != null) {
                    openURL(Uri.parse("$appScheme://shareextension?mediaUris=${Uri.encode(fileUri.toString())}"))
                    completeRequest()
                    return
                }
            }
            val encoded = Uri.encode(sharedText)
            val url = Uri.parse("$appScheme://shareextension?text=$encoded")
            openURL(url)
        }
        completeRequest()
    }

    @Suppress("DEPRECATION")
    private fun intentUris(intent: Intent): List<Uri?>? = try {
        when (intent.action) {
            Intent.ACTION_SEND -> listOf(
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    intent.getParcelableExtra(Intent.EXTRA_STREAM, Uri::class.java)
                } else {
                    intent.getParcelableExtra(Intent.EXTRA_STREAM) as? Uri
                }
            )
            Intent.ACTION_SEND_MULTIPLE -> {
                val list = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    intent.getParcelableArrayListExtra(Intent.EXTRA_STREAM, Parcelable::class.java)
                } else {
                    intent.getParcelableArrayListExtra<Parcelable>(Intent.EXTRA_STREAM)
                }
                list?.map { it as? Uri }
            }
            else -> null
        }
    } catch (e: Exception) {
        Log.e("ShareRocketChat", "Invalid share extras", e)
        null
    }

    private fun handleMedia(intent: Intent) {
        val mediaUris = StringBuilder()
        var valid = true

        intentUris(intent)?.forEach { uri ->
            val mediaUri = uri?.let { handleMediaUri(it, intent.type) }
            if (mediaUri != null) {
                if (mediaUris.isNotEmpty()) {
                    mediaUris.append(",")
                }
                mediaUris.append(mediaUri)
            } else {
                valid = false
            }
        }

        if (!valid || mediaUris.isEmpty()) {
            completeRequest()
            return
        }
        val encoded = Uri.encode(mediaUris.toString())
        val url = Uri.parse("$appScheme://shareextension?mediaUris=$encoded")
        openURL(url)
        completeRequest()
    }

    private fun handleMediaUri(uri: Uri, fallbackMime: String?): String? {
        return try {
            contentResolver.openInputStream(uri)?.use { input ->
                val filename = sanitizeFileName(getFileName(uri))
                    ?: UUID.randomUUID().toString() + getFileExtension(uri, fallbackMime)
                saveStreamToCacheDir(input, filename)
            }?.toString()
        } catch (e: Exception) {
            Log.e("ShareRocketChat", "Failed to process media", e)
            null
        }
    }

    private fun getFileName(uri: Uri): String? {
        // Attempt to get the original filename from the Uri
        val projection = arrayOf(OpenableColumns.DISPLAY_NAME)
        return try {
            contentResolver.query(uri, projection, null, null, null)?.use {
                if (it.moveToFirst()) {
                    it.getString(it.getColumnIndexOrThrow(OpenableColumns.DISPLAY_NAME))
                } else null
            }
        } catch (e: Exception) {
            Log.e("ShareRocketChat", "Failed to read display name", e)
            null
        }
    }

    private fun sanitizeFileName(name: String?): String? {
        val base = name?.substringAfterLast('/')?.substringAfterLast('\\')?.trim()
        return if (base.isNullOrEmpty() || base == "." || base == "..") null else base
    }

    private fun getFileExtension(uri: Uri, fallbackMime: String?): String {
        // Determine the file extension based on the mime type, with fallbacks
        val mimeType = contentResolver.getType(uri) ?: fallbackMime
        return when {
            mimeType == "image/jpeg" -> ".jpg"
            mimeType == "image/png" -> ".png"
            mimeType == "image/webp" -> ".webp"
            mimeType == "image/gif" -> ".gif"
            mimeType == "video/mp4" -> ".mp4"
            mimeType == "video/webm" -> ".webm"
            mimeType == "video/3gpp" -> ".3gp"
            mimeType == "video/quicktime" -> ".mov"
            mimeType == "text/x-vcard" || mimeType == "text/vcard" -> ".vcf"
            mimeType == "text/html" -> ".html"
            mimeType?.startsWith("text/") == true -> ".txt"
            mimeType == "audio/mpeg" -> ".mp3"
            mimeType == "audio/x-wav" || mimeType == "audio/wav" || mimeType == "audio/wave" -> ".wav"
            mimeType == "audio/ogg" -> ".ogg"
            mimeType == "audio/mp4" || mimeType == "audio/x-m4a" -> ".m4a"
            mimeType == "audio/aac" || mimeType == "audio/x-aac" -> ".aac"
            mimeType == "audio/flac" || mimeType == "audio/x-flac" -> ".flac"
            mimeType == "audio/amr" || mimeType == "audio/amr-wb" -> ".amr"
            mimeType == "audio/midi" || mimeType == "audio/x-midi" -> ".mid"
            mimeType == "audio/opus" -> ".opus"
            mimeType == "application/pdf" -> ".pdf"
            mimeType == "application/zip" -> ".zip"
            mimeType == "application/json" -> ".json"
            else -> "" // Unknown type: keep the file extensionless and let the receiver decide
        }
    }

    private fun sharedDir(): File = File(cacheDir, "shared").apply { mkdirs() }

    private fun cleanupSharedDir() {
        try {
            val cutoff = System.currentTimeMillis() - 24 * 60 * 60 * 1000L
            sharedDir().listFiles()?.forEach { file ->
                if (file.isFile && file.lastModified() < cutoff && !file.delete()) {
                    Log.w("ShareRocketChat", "Failed to delete ${file.absolutePath}")
                }
            }
        } catch (e: Exception) {
            Log.e("ShareRocketChat", "Failed to clean shared cache", e)
        }
    }

    private fun saveStreamToCacheDir(input: InputStream, filename: String): Uri? {
        // Save the shared stream to the app's cache directory and return the file URI
        return try {
            val dir = sharedDir()
            var file = File(dir, filename)
            if (file.exists()) {
                file = File(dir, "${UUID.randomUUID()}-$filename")
            }
            FileOutputStream(file).use { output -> input.copyTo(output) }
            Uri.fromFile(file) // Return the file URI with file:// scheme
        } catch (e: Exception) {
            Log.e("ShareRocketChat", "Failed to save data", e)
            null
        }
    }

    private fun saveDataToCacheDir(data: ByteArray?, filename: String): Uri? {
        // Save the shared data to the app's cache directory and return the file URI
        return try {
            val file = File(sharedDir(), filename)
            FileOutputStream(file).use { it.write(data) }
            Uri.fromFile(file) // Return the file URI with file:// scheme
        } catch (e: Exception) {
            Log.e("ShareRocketChat", "Failed to save data", e)
            null
        }
    }

    private fun openURL(uri: Uri) {
        // Open the custom URI in the associated app
        val intent = Intent(Intent.ACTION_VIEW, uri)
        if (intent.resolveActivity(packageManager) != null) {
            startActivity(intent)
        } else {
            Log.w("ShareRocketChat", "No activity can handle $uri")
        }
    }

    private fun completeRequest() {
        // Finish the share activity
        finish()
    }
}
