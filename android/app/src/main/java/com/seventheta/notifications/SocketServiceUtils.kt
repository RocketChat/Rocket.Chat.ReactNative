package com.seventheta.notifications

import android.content.Context
import android.os.Build
import android.os.Bundle
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule


object SocketServiceUtils {

    private val useJobService = Build.VERSION.SDK_INT >= 26

    fun startService(context: Context) {
        if (useJobService) {
            SocketJobService.startService(context)
        } else {
            SocketService.startService(context)
        }
    }

    fun serviceReconnect(context: Context) {
        if (useJobService) {
            SocketJobService.serviceReconnect(context)
        } else {
            SocketService.startService(context)
        }
    }
}

fun ReactContext.sendEventToJS(eventName: String, data: Bundle) {
    sendEventToJS(eventName, Arguments.fromBundle(data))
}

fun ReactContext.sendEventToJS(eventName: String, data: WritableMap) {
    getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java).emit(eventName, data)
}
