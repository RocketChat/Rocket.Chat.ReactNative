package com.seventheta.notifications

import android.os.Bundle
import com.facebook.react.bridge.*

class NotificationsModule(context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {

    init {
        reactContext = context
        context.addLifecycleEventListener(object : LifecycleEventListener {
            override fun onHostResume() {
                isResumed = true
                maybeDispatchNotification()
            }

            override fun onHostPause() {
                isResumed = false
            }

            override fun onHostDestroy() {
            }
        })
    }

    override fun getName(): String = "SocketNotificationsModule"

    @ReactMethod
    fun invalidateNotifications() {
        SocketServiceUtils.serviceReconnect(reactApplicationContext)
    }

    @ReactMethod
    fun getInitialNotification(promise: Promise) {
        var result: Any? = null
        try {
            if (initialNotification != null) {
                result = Arguments.fromBundle(initialNotification)
//                initialNotification = null
            }

        } finally {
            promise.resolve(result)
        }
    }

    companion object {

        var reactContext: ReactContext? = null
        var isResumed = false
        var initialNotification: Bundle? = null
        var queuedNotification: Bundle? = null

        fun dispatchNotification(data: Bundle) {
            if (isResumed && reactContext != null) {
                reactContext!!.sendEventToJS("socketNotificationOpened", data)
            } else {
                queuedNotification = data
            }
        }

        fun maybeDispatchNotification() {
            if (isResumed && reactContext != null && queuedNotification != null) {
                reactContext!!.sendEventToJS("socketNotificationOpened", queuedNotification!!)
                queuedNotification = null
            }
        }
    }
}
