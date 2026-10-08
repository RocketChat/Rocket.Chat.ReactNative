# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# Looked up by name from native code or reflection, which R8 cannot trace
-keep class com.nozbe.watermelondb.** { *; }
-keep class * implements com.facebook.react.module.model.ReactModuleInfoProvider { *; }
-keep class com.android.installreferrer.api.** { *; }
-keep class com.google.android.gms.common.GoogleApiAvailability { *; }
-keepnames class com.google.mlkit.vision.barcode.BarcodeScanning
-keepclassmembers class com.facebook.react.uimanager.JSPointerDispatcher {
    public void handleMotionEvent(...);
}
-keepnames class com.swmansion.rnscreens.**
-keepclassmembers class com.swmansion.rnscreens.** {
    *** getScreen();
    *** getStackPresentation();
}
