package com.seventheta.notifications

import android.app.IntentService
import android.content.Intent
import chat.rocket.reactnative.BuildConfig

class NotificationsDeliveryService : IntentService("NotificationsDeliveryService") {

    override fun onHandleIntent(intent: Intent) {
        val notificationData = intent.getBundleExtra(EXTRA_NOTIFICATION_DATA)
        NotificationsModule.dispatchNotification(notificationData)
    }

    companion object {

        const val EXTRA_NOTIFICATION_DATA = "${BuildConfig.APPLICATION_ID}.NotificationsDeliveryService.EXTRA_NOTIFICATION_DATA"
    }
}
