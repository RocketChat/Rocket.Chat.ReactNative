package com.seventheta.notifications

import android.app.job.JobInfo
import android.app.job.JobParameters
import android.app.job.JobScheduler
import android.app.job.JobService
import android.content.ComponentName
import android.content.Context
import android.os.Handler
import android.os.Looper
import android.os.PersistableBundle
import android.util.Log
import chat.rocket.reactnative.BuildConfig

class SocketJobService : JobService() {

    private var params: JobParameters? = null

    override fun onCreate() {
        super.onCreate()
        Log.d("SOCKETNOTIS", "onCreate")
    }

    override fun onStartJob(params: JobParameters?): Boolean {
        this.params = params
        val command = params?.extras?.getString(EXTRA_COMMAND)

        Log.d("SOCKETNOTIS", "onStartJob, client: $_client")

        if (_client == null) {
            Log.d("SOCKETNOTIS", "constructing client...")
            _client = SocketNotificationManager(applicationContext)
        }

        val client = _client!!

        Log.d("SOCKETNOTIS", "onStartJob ready...")

        if (command != null) {
            when (command) {
                EXTRA_COMMAND_RECONNECT -> {
                    disconnectAndReconnect()
                    return true
                }
                EXTRA_COMMAND_STOP -> {
                    Log.d("SOCKETNOTIS", "COMMAND_STOP")
                    if (client.isConnected) {
                        client.close()
                    }
                    this.jobFinished(this.params, false)
                    return false
                }
            }
        }

        if (!client.isConnected) {
            val didConnect = connectClient()
            if (!didConnect) {
                return false
            }
        }

        Log.d("SOCKETNOTIS", "No command, rescheduling...")

        scheduleJobAgain(1000L * 15)
        return false
    }

    private fun disconnectAndReconnect() {
        _client?.close()
        Handler(Looper.getMainLooper()).postDelayed({
            val didConnect = connectClient()
            if (!didConnect) {
                scheduleJobAgain(1000L * 15)
            }
        }, 500)
    }

    private fun connectClient(): Boolean {
        Log.d("SOCKETNOTIS", "connecting...")
        val client = _client!!
        return client.evaluateAndConnect { interval ->
            scheduleJobAgain(interval)
        }
    }

    private fun scheduleJobAgain(interval: Long) {
        val serviceName = ComponentName(
                this.packageName,
                SocketJobService::class.java.name)

        val jobInfo = JobInfo.Builder(EXTRA_JOB_ID, serviceName).apply {
            setRequiredNetworkType(JobInfo.NETWORK_TYPE_ANY)
            setMinimumLatency(interval)
            setOverrideDeadline(interval)
        }.build()

        val jobScheduler = getSystemService(Context.JOB_SCHEDULER_SERVICE) as JobScheduler
        jobScheduler.schedule(jobInfo)
        this.jobFinished(this.params, false)
    }

    override fun onStopJob(params: JobParameters?): Boolean {
        Log.d("SOCKETNOTIS", "onStopJob")
        return false
    }

    override fun onDestroy() {
        Log.d("SOCKETNOTIS", "onDestroy")
//        val client = _client
//        if (client != null) {
//            if (client.isConnected) {
//                client.close()
//            }
//        }
//        _client = null
        super.onDestroy()
    }

    companion object {

        private var _client: SocketNotificationManager? = null

        const val EXTRA_JOB_ID = 528491

        const val EXTRA_COMMAND = "${BuildConfig.APPLICATION_ID}.extra.COMMAND"
        const val EXTRA_COMMAND_START = "${BuildConfig.APPLICATION_ID}.extra.COMMAND_START"
        const val EXTRA_COMMAND_RECONNECT = "${BuildConfig.APPLICATION_ID}.extra.COMMAND_RECONNECT"
        const val EXTRA_COMMAND_KEEP_ALIVE = "${BuildConfig.APPLICATION_ID}.extra.COMMAND_KEEP_ALIVE"
        const val EXTRA_COMMAND_STOP = "${BuildConfig.APPLICATION_ID}.extra.COMMAND_STOP"

        fun startService(context: Context) {
            val context = context.applicationContext
            val serviceName = ComponentName(
                    context.packageName,
                    SocketJobService::class.java.name)

            val jobInfo = JobInfo.Builder(EXTRA_JOB_ID, serviceName).apply {
                val extras = PersistableBundle().apply {
                    putString(EXTRA_COMMAND, EXTRA_COMMAND_START)
                }
                setExtras(extras)
                setRequiredNetworkType(JobInfo.NETWORK_TYPE_ANY)
                setMinimumLatency(1L)
                setOverrideDeadline(1L)
            }.build()

            val jobScheduler = context
                    .getSystemService(Context.JOB_SCHEDULER_SERVICE) as JobScheduler
            jobScheduler.schedule(jobInfo)
        }

        fun serviceReconnect(context: Context) {
            val context = context.applicationContext
            val serviceName = ComponentName(
                    context.packageName,
                    SocketJobService::class.java.name)

            val jobInfo = JobInfo.Builder(EXTRA_JOB_ID, serviceName).apply {
                val extras = PersistableBundle().apply {
                    putString(EXTRA_COMMAND, EXTRA_COMMAND_RECONNECT)
                }
                setExtras(extras)
                setRequiredNetworkType(JobInfo.NETWORK_TYPE_ANY)
                setMinimumLatency(1L)
                setOverrideDeadline(1L)
            }.build()

            val jobScheduler = context
                    .getSystemService(Context.JOB_SCHEDULER_SERVICE) as JobScheduler

            jobScheduler.cancel(EXTRA_JOB_ID)
            jobScheduler.schedule(jobInfo)
        }

        fun stopService(context: Context) {
            val context = context.applicationContext
            val serviceName = ComponentName(
                    context.packageName,
                    SocketJobService::class.java.name
            )

            val jobInfo = JobInfo.Builder(EXTRA_JOB_ID, serviceName).apply {
                val extras = PersistableBundle().apply {
                    putString(EXTRA_COMMAND, EXTRA_COMMAND_STOP)
                }
                setExtras(extras)
                setRequiredNetworkType(JobInfo.NETWORK_TYPE_ANY)
                setMinimumLatency(1L)
                setOverrideDeadline(1L)
            }.build()

            val jobScheduler = context
                    .getSystemService(Context.JOB_SCHEDULER_SERVICE) as JobScheduler
            jobScheduler.schedule(jobInfo)
        }
    }
}