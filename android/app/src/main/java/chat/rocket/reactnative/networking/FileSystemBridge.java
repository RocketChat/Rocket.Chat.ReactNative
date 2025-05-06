package chat.rocket.reactnative.networking;

import expo.modules.filesystem.FileSystemModule;
import okhttp3.OkHttpClient;

/**
 * Bridge class to access FileSystemModule's client field
 */
public class FileSystemBridge {
    /**
     * Sets the OkHttpClient instance for the FileSystemModule
     *
     * @param client OkHttpClient instance to be used by the FileSystemModule
     */
    public static void setOkHttpClient(OkHttpClient client) {
        try {
            // Use reflection to access the client field directly
            java.lang.reflect.Field clientField = FileSystemModule.class.getDeclaredField("client");
            clientField.setAccessible(true);
            clientField.set(null, client);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
} 