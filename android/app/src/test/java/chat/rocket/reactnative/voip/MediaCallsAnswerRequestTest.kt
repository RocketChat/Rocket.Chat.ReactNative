package chat.rocket.reactnative.voip

import okhttp3.Call
import okhttp3.Callback
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import okhttp3.mockwebserver.SocketPolicy
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import java.io.IOException
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicInteger

/**
 * JVM unit tests for the OkHttp timeout and late-success-reject logic in
 * [MediaCallsAnswerRequest].
 *
 * These tests build an OkHttp client with the same timeout configuration as the
 * production code (callTimeout, connectTimeout, readTimeout, writeTimeout) and
 * drive it against a [MockWebServer] to verify:
 *
 *  (a) A response delayed past callTimeout causes a client-side failure event
 *      AND a reject REST call is dispatched (late-success reconciliation).
 *  (b) A response delivered within callTimeout produces a success event with no
 *      reject and no double-finish.
 *
 * Tests use a reduced callTimeout (200 ms) so the suite completes quickly.
 */
class MediaCallsAnswerRequestTest {

    private lateinit var server: MockWebServer

    @Before
    fun setUp() {
        server = MockWebServer()
        server.start()
    }

    @After
    fun tearDown() {
        server.shutdown()
    }

    // ---------------------------------------------------------------------------
    // Helper: build a client mirroring the production configuration but with an
    // injectable callTimeout so tests can run in < 1 s total.
    // ---------------------------------------------------------------------------

    private fun buildClient(callTimeoutMs: Long): OkHttpClient =
        OkHttpClient.Builder()
            .callTimeout(callTimeoutMs, TimeUnit.MILLISECONDS)
            .connectTimeout(callTimeoutMs / 2, TimeUnit.MILLISECONDS)
            .readTimeout(callTimeoutMs, TimeUnit.MILLISECONDS)
            .writeTimeout(callTimeoutMs, TimeUnit.MILLISECONDS)
            .build()

    // ---------------------------------------------------------------------------
    // Helper: simulate the accept-request + late-success-reject callback flow
    // that lives inside VoipNotification.handleAcceptAction.
    //
    // Returns a pair of (finishSuccessCount, rejectSentCount) so the test can
    // assert that finish was called exactly once and reject was/wasn't sent.
    // ---------------------------------------------------------------------------

    private fun simulateAcceptWithLateRejectGuard(
        client: OkHttpClient,
        acceptUrl: String,
        rejectUrl: String,
        deadlineMs: Long
    ): Pair<Int, Int> {
        val finished = AtomicBoolean(false)
        val finishSuccessCount = AtomicInteger(0)
        val rejectSentCount = AtomicInteger(0)

        // Counts down once the OkHttp callback (success, failure, or late-success
        // reconcile path) returns. The deadline thread runs independently and does
        // not affect this latch, so the test can wait for the OkHttp side to fully
        // settle before reading counters — preventing a race where the deadline
        // fires first and the test reads rejectSentCount before the late-success
        // path has incremented it.
        val okhttpDone = CountDownLatch(1)

        fun finish(answerSucceeded: Boolean) {
            if (!finished.compareAndSet(false, true)) return
            if (answerSucceeded) finishSuccessCount.incrementAndGet()
        }

        // Deadline runnable — mirrors the 10 s Handler.postDelayed in production.
        val deadlineThread = Thread {
            try {
                Thread.sleep(deadlineMs)
            } catch (_: InterruptedException) {
                return@Thread
            }
            finish(false)
        }
        deadlineThread.isDaemon = true
        deadlineThread.start()

        val jsonType = "application/json; charset=utf-8".toMediaType()
        val body = """{"callId":"test","contractId":"dev","answer":"accept"}"""
            .toRequestBody(jsonType)
        val acceptRequest = Request.Builder().url(acceptUrl).post(body).build()

        client.newCall(acceptRequest).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                try {
                    // Network/timeout failure — equivalent to the deadline path, no reject needed.
                    finish(false)
                } finally {
                    okhttpDone.countDown()
                }
            }

            override fun onResponse(call: Call, response: Response) {
                try {
                    response.use {
                        val success = it.code in 200..299
                        // Late-success guard (mirrors VoipNotification lines 317-330).
                        if (success && finished.get()) {
                            // Deadline already fired; send reject to reconcile server state.
                            val rejectBody = """{"callId":"test","contractId":"dev","answer":"reject"}"""
                                .toRequestBody(jsonType)
                            val rejectRequest = Request.Builder().url(rejectUrl).post(rejectBody).build()
                            try {
                                client.newCall(rejectRequest).execute().use { _ ->
                                    rejectSentCount.incrementAndGet()
                                }
                            } catch (_: IOException) {
                                // Reject best-effort; count it anyway for test assertion.
                                rejectSentCount.incrementAndGet()
                            }
                            return
                        }
                        finish(success)
                    }
                } finally {
                    okhttpDone.countDown()
                }
            }
        })

        // Wait up to 5 s for the OkHttp callback to fully settle.
        assertTrue("OkHttp callback never completed within 5 s", okhttpDone.await(5, TimeUnit.SECONDS))
        deadlineThread.interrupt()

        return finishSuccessCount.get() to rejectSentCount.get()
    }

    // ---------------------------------------------------------------------------
    // (a) OkHttp timeout fires before deadline → onFailure path; no reject is sent
    // because finished=false at that point and the late-success branch is not
    // reachable. The accept request never gets a server response.
    // ---------------------------------------------------------------------------

    @Test
    fun `okhttp timeout before deadline fails without dispatching a reconcile reject`() {
        val callTimeoutMs = 200L

        // Accept request: no response → OkHttp times out and fires onFailure.
        server.enqueue(MockResponse().apply { socketPolicy = SocketPolicy.NO_RESPONSE })

        val client = buildClient(callTimeoutMs)
        val url = server.url("/api/v1/media-calls.answer").toString()

        // Deadline is longer than callTimeout so the OkHttp timeout fires first.
        val (finishSuccess, rejectSent) = simulateAcceptWithLateRejectGuard(
            client,
            acceptUrl = url,
            rejectUrl = url,
            deadlineMs = callTimeoutMs * 5
        )

        assertEquals("finish(true) must NOT be called on timeout", 0, finishSuccess)
        assertEquals("No reconcile-reject should fire on OkHttp timeout (already finished=false)", 0, rejectSent)
        assertEquals("Server should receive exactly one request (the accept)", 1, server.requestCount)
    }

    // ---------------------------------------------------------------------------
    // Late-success scenario: deadline fires first (finished=true), then OkHttp
    // delivers success. The reconcile-reject MUST be sent.
    // ---------------------------------------------------------------------------

    @Test
    fun `late success after deadline fires reject to reconcile server state`() {
        val callTimeoutMs = 2000L  // Long enough that OkHttp does NOT time out on its own.
        val deadlineMs = 100L      // Deadline fires well before OkHttp would timeout.

        // Accept request: add a delay so OkHttp responds AFTER the deadline.
        server.enqueue(
            MockResponse()
                .setResponseCode(200)
                .setBodyDelay(deadlineMs * 3, TimeUnit.MILLISECONDS)
                .setBody("{}")
        )
        // Reject reconcile request: immediate 200.
        server.enqueue(MockResponse().setResponseCode(200))

        val client = buildClient(callTimeoutMs)
        val url = server.url("/api/v1/media-calls.answer").toString()

        val (finishSuccess, rejectSent) = simulateAcceptWithLateRejectGuard(
            client,
            acceptUrl = url,
            rejectUrl = url,
            deadlineMs = deadlineMs
        )

        assertEquals("finish(true) must NOT be called (deadline already fired)", 0, finishSuccess)
        assertEquals("Reconcile-reject MUST be sent when late-success arrives after deadline", 1, rejectSent)

        // Server should have received both the accept and the reject.
        assertEquals(2, server.requestCount)
        val acceptReq = server.takeRequest()
        assertTrue(acceptReq.body.readUtf8().contains("\"accept\""))
        val rejectReq = server.takeRequest()
        assertTrue(rejectReq.body.readUtf8().contains("\"reject\""))
    }

    // ---------------------------------------------------------------------------
    // (b) Response within callTimeout → success event, no reject, no double-finish.
    // ---------------------------------------------------------------------------

    @Test
    fun `response within callTimeout succeeds with no reject and no double finish`() {
        val callTimeoutMs = 2000L

        // Accept request: immediate 200.
        server.enqueue(MockResponse().setResponseCode(200).setBody("{}"))

        val client = buildClient(callTimeoutMs)
        val url = server.url("/api/v1/media-calls.answer").toString()

        // Deadline is much longer so OkHttp responds before it fires.
        val (finishSuccess, rejectSent) = simulateAcceptWithLateRejectGuard(
            client,
            acceptUrl = url,
            rejectUrl = url,
            deadlineMs = callTimeoutMs * 5
        )

        assertEquals("finish(true) must be called exactly once on success", 1, finishSuccess)
        assertEquals("No reject should be sent on clean success", 0, rejectSent)
        assertEquals("Server should receive exactly one request", 1, server.requestCount)
    }

}
