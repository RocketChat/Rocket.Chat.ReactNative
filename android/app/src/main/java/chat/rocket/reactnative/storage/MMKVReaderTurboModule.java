package chat.rocket.reactnative.storage;

import android.util.Log;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.Arguments;

import java.io.File;
import java.io.FileInputStream;
import java.io.RandomAccessFile;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;

public class MMKVReaderTurboModule extends NativeMMKVReaderSpec {

    private static final String TAG = "MMKVReader";
    private ReactApplicationContext reactContext;

    public MMKVReaderTurboModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return NativeMMKVReaderSpec.NAME;
    }

    @Override
    public void getStoragePath(Promise promise) {
        try {
            File filesDir = reactContext.getFilesDir();
            File mmkvDir = new File(filesDir, "mmkv");
            
            WritableMap result = Arguments.createMap();
            result.putString("filesDir", filesDir.getAbsolutePath());
            result.putString("mmkvDir", mmkvDir.getAbsolutePath());
            result.putBoolean("mmkvDirExists", mmkvDir.exists());
            
            Log.d(TAG, "Files Directory: " + filesDir.getAbsolutePath());
            Log.d(TAG, "MMKV Directory: " + mmkvDir.getAbsolutePath());
            Log.d(TAG, "MMKV Directory exists: " + mmkvDir.exists());
            
            promise.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Error getting storage path", e);
            promise.reject("ERROR", e.getMessage());
        }
    }

    @Override
    public void listMMKVFiles(Promise promise) {
        try {
            File filesDir = reactContext.getFilesDir();
            File mmkvDir = new File(filesDir, "mmkv");
            
            WritableArray filesList = Arguments.createArray();
            
            Log.d(TAG, "=== MMKV Files List ===");
            Log.d(TAG, "Looking in: " + mmkvDir.getAbsolutePath());
            
            if (mmkvDir.exists() && mmkvDir.isDirectory()) {
                File[] files = mmkvDir.listFiles();
                if (files != null) {
                    for (File file : files) {
                        WritableMap fileInfo = Arguments.createMap();
                        fileInfo.putString("name", file.getName());
                        fileInfo.putString("path", file.getAbsolutePath());
                        fileInfo.putDouble("size", file.length());
                        fileInfo.putBoolean("isFile", file.isFile());
                        filesList.pushMap(fileInfo);
                        
                        Log.d(TAG, "File: " + file.getName() + " (" + file.length() + " bytes)");
                    }
                } else {
                    Log.d(TAG, "Directory is empty or cannot read files");
                }
            } else {
                Log.d(TAG, "MMKV directory does not exist");
            }
            
            Log.d(TAG, "======================");
            
            promise.resolve(filesList);
        } catch (Exception e) {
            Log.e(TAG, "Error listing MMKV files", e);
            promise.reject("ERROR", e.getMessage());
        }
    }

    @Override
    public void readAndDecryptMMKV(String mmkvId, Promise promise) {
        try {
            Log.d(TAG, "=== Starting MMKV Read and Decrypt ===");
            Log.d(TAG, "MMKV ID: " + mmkvId);
            
            // Get the encryption key from SecureKeystore
            SecureKeystore secureKeystore = new SecureKeystore(reactContext);
            String alias = toHex("com.MMKV." + mmkvId);
            String password = secureKeystore.getSecureKey(alias);
            
            Log.d(TAG, "Alias (hex): " + alias);
            Log.d(TAG, "Encryption key retrieved: " + (password != null ? "YES (length: " + password.length() + ")" : "NO"));
            
            if (password == null) {
                Log.e(TAG, "Failed to retrieve encryption key from SecureKeystore");
                promise.reject("NO_KEY", "Could not retrieve encryption key");
                return;
            }
            
            // Find the MMKV file
            File filesDir = reactContext.getFilesDir();
            File mmkvDir = new File(filesDir, "mmkv");
            File mmkvFile = new File(mmkvDir, mmkvId);
            
            Log.d(TAG, "MMKV file path: " + mmkvFile.getAbsolutePath());
            Log.d(TAG, "File exists: " + mmkvFile.exists());
            
            if (!mmkvFile.exists()) {
                Log.e(TAG, "MMKV file does not exist");
                promise.reject("NO_FILE", "MMKV file does not exist: " + mmkvFile.getAbsolutePath());
                return;
            }
            
            long fileSize = mmkvFile.length();
            Log.d(TAG, "File size: " + fileSize + " bytes");
            
            // Read the file
            byte[] fileContent = readFile(mmkvFile);
            Log.d(TAG, "File content read: " + fileContent.length + " bytes");
            
            // Log first 100 bytes in hex for inspection
            logHexDump("Raw file content (first 100 bytes)", fileContent, Math.min(100, fileContent.length));
            
            // Try to decrypt the content
            Map<String, String> decryptedData = decryptMMKVContent(fileContent, password);
            
            Log.d(TAG, "Decrypted entries: " + decryptedData.size());
            
            // Convert to WritableMap for React Native
            WritableMap result = Arguments.createMap();
            for (Map.Entry<String, String> entry : decryptedData.entrySet()) {
                result.putString(entry.getKey(), entry.getValue());
                Log.d(TAG, "Key: " + entry.getKey() + " = " + entry.getValue());
            }
            
            Log.d(TAG, "=== MMKV Read and Decrypt Complete ===");
            
            promise.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Error reading and decrypting MMKV", e);
            Log.e(TAG, "Stack trace: " + Log.getStackTraceString(e));
            promise.reject("ERROR", e.getMessage());
        }
    }

    private byte[] readFile(File file) throws Exception {
        FileInputStream fis = new FileInputStream(file);
        byte[] content = new byte[(int) file.length()];
        fis.read(content);
        fis.close();
        return content;
    }

    private Map<String, String> decryptMMKVContent(byte[] encryptedContent, String password) throws Exception {
        Log.d(TAG, "=== Starting MMKV Content Decryption ===");
        
        Map<String, String> result = new HashMap<>();
        
        // MMKV file format (simplified):
        // The file is encrypted with AES CFB-128
        // The IV for AES is derived from the file content or stored in the file
        
        try {
            // Read MMKV header
            ByteBuffer buffer = ByteBuffer.wrap(encryptedContent);
            buffer.order(ByteOrder.LITTLE_ENDIAN);
            
            // MMKV file starts with a magic number and version
            if (encryptedContent.length < 4) {
                Log.e(TAG, "File too short to be valid MMKV");
                return result;
            }
            
            // For encrypted MMKV, we need to decrypt the entire content
            // The encryption uses AES-CFB-128 with PKCS7 padding
            
            // Prepare the AES key
            byte[] keyBytes = password.getBytes("UTF-8");
            SecretKeySpec keySpec = new SecretKeySpec(keyBytes, "AES");
            
            Log.d(TAG, "AES key length: " + keyBytes.length + " bytes");
            
            // MMKV uses the first 16 bytes as IV or generates one
            // For simplicity, we'll try a zero IV first, then the first 16 bytes
            byte[] iv = new byte[16];
            
            // Try with zero IV first
            byte[] decrypted = decryptAESCFB(encryptedContent, keySpec, iv);
            
            if (decrypted != null) {
                logHexDump("Decrypted content (first 100 bytes)", decrypted, Math.min(100, decrypted.length));
                
                // Try to parse the decrypted content
                parseMMKVData(decrypted, result);
            } else {
                Log.e(TAG, "Decryption returned null");
            }
            
            // If zero IV didn't work, try using first 16 bytes as IV
            if (result.isEmpty() && encryptedContent.length > 16) {
                Log.d(TAG, "Trying with file-based IV...");
                System.arraycopy(encryptedContent, 0, iv, 0, 16);
                byte[] dataToDecrypt = Arrays.copyOfRange(encryptedContent, 16, encryptedContent.length);
                decrypted = decryptAESCFB(dataToDecrypt, keySpec, iv);
                
                if (decrypted != null) {
                    logHexDump("Decrypted content with file IV (first 100 bytes)", decrypted, Math.min(100, decrypted.length));
                    parseMMKVData(decrypted, result);
                }
            }
            
        } catch (Exception e) {
            Log.e(TAG, "Error during decryption", e);
            throw e;
        }
        
        Log.d(TAG, "=== MMKV Content Decryption Complete ===");
        return result;
    }

    private byte[] decryptAESCFB(byte[] encryptedData, SecretKeySpec keySpec, byte[] iv) {
        try {
            Log.d(TAG, "Attempting AES-CFB decryption...");
            Log.d(TAG, "Data length: " + encryptedData.length);
            Log.d(TAG, "IV: " + bytesToHex(iv));
            
            Cipher cipher = Cipher.getInstance("AES/CFB/NoPadding");
            IvParameterSpec ivSpec = new IvParameterSpec(iv);
            cipher.init(Cipher.DECRYPT_MODE, keySpec, ivSpec);
            
            byte[] decrypted = cipher.doFinal(encryptedData);
            Log.d(TAG, "Decryption successful, result length: " + decrypted.length);
            
            return decrypted;
        } catch (Exception e) {
            Log.e(TAG, "AES decryption error", e);
            return null;
        }
    }

    private void parseMMKVData(byte[] data, Map<String, String> result) {
        try {
            Log.d(TAG, "=== Parsing MMKV Data ===");
            
            // Extract all null-terminated strings
            java.util.List<String> allStrings = new java.util.ArrayList<>();
            int start = 0;
            
            for (int i = 0; i < data.length - 1; i++) {
                if (data[i] == 0 && i > start) {
                    byte[] stringBytes = Arrays.copyOfRange(data, start, i);
                    String str = new String(stringBytes, "UTF-8");
                    
                    if (isPrintable(str) && str.length() > 0) {
                        allStrings.add(str);
                    }
                    start = i + 1;
                }
            }
            
            Log.d(TAG, "Total strings found: " + allStrings.size());
            Log.d(TAG, "");
            Log.d(TAG, "=== All Extracted Strings ===");
            
            // Try to pair keys with values
            // MMKV often stores key-value pairs sequentially
            for (int i = 0; i < allStrings.size(); i++) {
                String str = allStrings.get(i);
                
                // Log each string
                Log.d(TAG, String.format("[%d] %s", i, str));
                
                // Store with index
                result.put("string_" + i, str);
                
                // Also try to identify if this looks like a key
                // Common MMKV keys in Rocket.Chat:
                if (str.contains("reactnativemeteor") || 
                    str.contains("RC_E2E") || 
                    str.contains("http") ||
                    str.contains("token") ||
                    str.length() > 20) {
                    
                    // If next string exists and is different, it might be the value
                    if (i + 1 < allStrings.size()) {
                        String nextStr = allStrings.get(i + 1);
                        if (!nextStr.equals(str)) {
                            result.put(str, nextStr);
                            Log.d(TAG, String.format("  → Paired with next: %s", nextStr.substring(0, Math.min(50, nextStr.length()))));
                        }
                    }
                }
            }
            
            Log.d(TAG, "");
            Log.d(TAG, "=== Identified Key-Value Pairs ===");
            for (Map.Entry<String, String> entry : result.entrySet()) {
                if (!entry.getKey().startsWith("string_")) {
                    String value = entry.getValue();
                    String displayValue = value.length() > 100 ? value.substring(0, 100) + "..." : value;
                    Log.d(TAG, String.format("Key: %s", entry.getKey()));
                    Log.d(TAG, String.format("  Value: %s", displayValue));
                    Log.d(TAG, "");
                }
            }
            
            Log.d(TAG, "=== MMKV Data Parsing Complete ===");
            
        } catch (Exception e) {
            Log.e(TAG, "Error parsing MMKV data", e);
        }
    }

    private boolean isPrintable(String str) {
        for (char c : str.toCharArray()) {
            if (c < 32 || c > 126) {
                if (c != '\n' && c != '\r' && c != '\t') {
                    return false;
                }
            }
        }
        return true;
    }

    private void logHexDump(String title, byte[] data, int length) {
        Log.d(TAG, "--- " + title + " ---");
        StringBuilder hex = new StringBuilder();
        StringBuilder ascii = new StringBuilder();
        
        for (int i = 0; i < length; i++) {
            if (i > 0 && i % 16 == 0) {
                Log.d(TAG, hex.toString() + "  " + ascii.toString());
                hex = new StringBuilder();
                ascii = new StringBuilder();
            }
            
            hex.append(String.format("%02X ", data[i]));
            char c = (char) (data[i] & 0xFF);
            ascii.append((c >= 32 && c <= 126) ? c : '.');
        }
        
        if (hex.length() > 0) {
            Log.d(TAG, hex.toString() + "  " + ascii.toString());
        }
        Log.d(TAG, "---");
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02X", b));
        }
        return sb.toString();
    }

    private String toHex(String arg) {
        try {
            byte[] bytes = arg.getBytes("UTF-8");
            StringBuilder sb = new StringBuilder();
            for (byte b : bytes) {
                sb.append(String.format("%x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            Log.e(TAG, "Error converting to hex", e);
            return "";
        }
    }
}

