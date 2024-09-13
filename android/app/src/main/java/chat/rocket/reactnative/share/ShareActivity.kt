package chat.rocket.reactnative.share

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.util.Log
import androidx.appcompat.app.AppCompatActivity
import java.io.File
import java.io.FileOutputStream
import java.util.*

class ShareActivity : AppCompatActivity() {

    private val appScheme = "rocketchat"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        handleIntent(intent)
    }

    private fun handleIntent(intent: Intent?) {
        // Check if the intent contains shared content
        if (intent?.action == Intent.ACTION_SEND || intent?.action == Intent.ACTION_SEND_MULTIPLE) {
            when {
                intent.type?.startsWith("text/") == true -> handleText(intent)
                intent.type?.startsWith("image/") == true -> handleMedia(intent, "data")
                intent.type?.startsWith("video/") == true -> handleMedia(intent, "data")
                intent.type?.startsWith("application/") == true -> handleMedia(intent, "data")
                intent.type == "*/*" -> handleMedia(intent, "data")
                intent.type == "text/plain" -> handleText(intent)
                else -> completeRequest() // No matching type, complete the request
            }
        } else {
            completeRequest() // No relevant intent action, complete the request
        }
    }

    private fun handleText(intent: Intent) {
        // Handle sharing text
        val sharedText = intent.getStringExtra(Intent.EXTRA_TEXT)
        if (sharedText != null) {
            val encoded = Uri.encode(sharedText)
            val url = Uri.parse("$appScheme://shareextension?text=$encoded")
            openURL(url)
        }
        completeRequest()
    }

    private fun handleMedia(intent: Intent, type: String) {
        val mediaUris = StringBuilder()
        var valid = true

        val uris = when (intent.action) {
            Intent.ACTION_SEND -> listOf(intent.getParcelableExtra(Intent.EXTRA_STREAM) as Uri?)
            Intent.ACTION_SEND_MULTIPLE -> intent.getParcelableArrayListExtra<Uri>(Intent.EXTRA_STREAM)
            else -> null
        }

        uris?.forEachIndexed { index, uri ->
            val mediaUri = uri?.let { handleMediaUri(it, type) }
            if (mediaUri != null) {
                mediaUris.append(mediaUri)
                if (index < uris.size - 1) {
                    mediaUris.append(",")
                }
            } else {
                valid = false
            }
        }

        if (valid) {
            val encoded = Uri.encode(mediaUris.toString())
            val url = Uri.parse("$appScheme://shareextension?mediaUris=$encoded")
            openURL(url)
        }
        completeRequest()
    }

    private fun handleMediaUri(uri: Uri, type: String): String? {
        return try {
            val inputStream = contentResolver.openInputStream(uri)
            val originalFilename = getFileName(uri)
            val filename = originalFilename ?: UUID.randomUUID().toString() + getFileExtension(uri, type)
            val fileUri = saveDataToCacheDir(inputStream?.readBytes(), filename)
            fileUri?.toString()
        } catch (e: Exception) {
            Log.e("ShareRocketChat", "Failed to process media", e)
            null
        }
    }

    private fun getFileName(uri: Uri): String? {
        // Attempt to get the original filename from the Uri
        val cursor = contentResolver.query(uri, null, null, null, null)
        return cursor?.use {
            if (it.moveToFirst()) {
                val nameIndex = it.getColumnIndex("_display_name")
                if (nameIndex != -1) it.getString(nameIndex) else null
            } else null
        }
    }

    private fun getFileExtension(uri: Uri, type: String): String {
        // Determine the file extension based on the mime type, with fallbacks
        val mimeType = contentResolver.getType(uri)
        return when {
            mimeType?.startsWith("image/") == true -> ".jpeg"
            mimeType?.startsWith("video/") == true -> ".mp4"
            else -> "" // Ignore the file if the type is not recognized
        }
    }

    private fun saveDataToCacheDir(data: ByteArray?, filename: String): Uri? {
        // Save the shared data to the app's cache directory and return the file URI
        return try {
            val file = File(cacheDir, filename)
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
        }
    }

    private fun completeRequest() {
        // Finish the share activity
        finish()
    }
}
