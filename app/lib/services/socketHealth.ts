import { onAbort } from '../methods/helpers/onAbort';
import sdk, { type TDriver } from './sdk';

/**
 * The recovery plan — what classification decides.
 * `'round-trip-check'` means a stored ping timestamp can't vouch for a socket
 * the OS may have frozen, so anything young enough is verified by a round trip,
 * never trusted outright.
 *
 * Exported for unit tests; callers never branch on it — they call
 * `recoverSocket()` and see outcomes.
 */
export type SocketRecoveryPlan = 'reopen' | 'round-trip-check';

export function classifySocketHealth(driver: TDriver): SocketRecoveryPlan {
	// `driver.connected` already folds in the ping-age test, so a stale ping lands here.
	if (!driver.connected) {
		return 'reopen';
	}
	// A connected socket is still verified by a round trip, never trusted outright:
	// onOpen refreshes lastPing before the handshake reply lands.
	return 'round-trip-check';
}

/**
 * What a recovery attempt reports.
 * - `'confirmed-alive'` — round trip succeeded; nothing was done.
 * - `'reopened'`        — socket reopened (stale ping, or round trip failed).
 * - `'no-socket'`       — there is no socket; nothing to recover.
 * - `'abandoned'`       — caller's abort signal fired while waiting; the
 *                         underlying recovery (shared — see below) runs on.
 *
 * Errors from `reopenNow()`/`probe()` REJECT the promise rather than becoming
 * an outcome: both current callers already sit in catch paths (`state.js`
 * logs, accept gate fails the call), and a thrown error is not a decision the
 * module can make for them.
 */
export type SocketRecoveryOutcome = 'confirmed-alive' | 'reopened' | 'no-socket' | 'abandoned';

let inFlightRecovery: Promise<SocketRecoveryOutcome> | null = null;

function shareRecovery(): Promise<SocketRecoveryOutcome> {
	if (inFlightRecovery) {
		return inFlightRecovery;
	}
	const driver = sdk.driver;
	if (!driver) {
		return Promise.resolve('no-socket');
	}
	const recovery = (async (): Promise<SocketRecoveryOutcome> => {
		if (classifySocketHealth(driver) === 'reopen') {
			await driver.reopenNow();
			return 'reopened';
		}
		const alive = await driver.probe(2000);
		if (alive) {
			return 'confirmed-alive';
		}
		await driver.reopenNow();
		return 'reopened';
	})();
	inFlightRecovery = recovery;
	const release = () => {
		if (inFlightRecovery === recovery) {
			inFlightRecovery = null;
		}
	};
	recovery.then(release, release);
	return recovery;
}

/**
 * The single entry point for both callers. Classifies, then executes:
 * `reopen` → `reopenNow()`; `round-trip-check` → `probe(2000)`, reopening on a
 * dead round trip.
 *
 * One entry, two usage postures — the semantics live in the call site, not in
 * two named functions:
 *
 *   // Foreground ladder (app/sagas/state.js) — fire-and-forget:
 *   recoverSocket().catch(log);
 *
 *   // Accept gate (acceptNativeCall.ts) — awaited, abortable:
 *   const outcome = await recoverSocket({ abortSignal: controller.signal });
 *   if (outcome === 'no-socket') return handleFailure(callId, mediaSession);
 *   if (outcome === 'abandoned') return;
 *
 * Concurrency: overlapping calls share one in-flight recovery — the second
 * caller awaits the same work and receives its outcome. An abort signal
 * detaches the caller from the shared wait (`'abandoned'`); it never cancels
 * the recovery itself, since another caller may depend on it.
 */
export function recoverSocket(options?: { abortSignal?: AbortSignal }): Promise<SocketRecoveryOutcome> {
	const { abortSignal } = options ?? {};
	if (abortSignal?.aborted) {
		return Promise.resolve('abandoned');
	}

	const recovery = shareRecovery();
	if (!abortSignal) {
		return recovery;
	}
	const abandoned = new Promise<SocketRecoveryOutcome>(resolve => {
		onAbort(abortSignal, () => resolve('abandoned'));
	});
	return Promise.race([recovery, abandoned]);
}
