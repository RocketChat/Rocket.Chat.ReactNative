package com.seventheta.notifications

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class NotificationsModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "SocketNotificationsModule"

    @ReactMethod
    fun onSuccessfulLogin(token: String) {
        SocketServiceUtils.startService(reactApplicationContext)
    }
}
