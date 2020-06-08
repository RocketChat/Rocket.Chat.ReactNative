package com.seventheta.notifications

import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.Build
import android.os.Bundle
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule


object SocketServiceUtils {

    private val useJobService = Build.VERSION.SDK_INT >= 21

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

val ConnectivityManager.isConnectedToNetwork: Boolean
    get() {
        val connectivityManager = this
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val nw = connectivityManager.activeNetwork ?: return false
            val actNw = connectivityManager.getNetworkCapabilities(nw) ?: return false
            return when {
                actNw.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) -> true
                actNw.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) -> true
                //for other device how are able to connect with Ethernet
                actNw.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET) -> true
                //for check internet over Bluetooth
                actNw.hasTransport(NetworkCapabilities.TRANSPORT_BLUETOOTH) -> true
                else -> false
            }
        } else {
            val nwInfo = connectivityManager.activeNetworkInfo ?: return false
            return nwInfo.isConnected
        }
    }
