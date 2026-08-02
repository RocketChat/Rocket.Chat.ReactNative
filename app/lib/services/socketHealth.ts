import { onAbort } from '../methods/helpers/onAbort';
import sdk, { type ConnectionStatus } from './sdk';

/**
 * The slice of the patched ddp-client connection this module reads
 * (`probe`/`reopenNow`/`lastPing` come from patches/@rocket.chat+ddp-client+0.3.51.patch).
 * The only guard is `sdk.current?.connection` being undefined — the patch is
 * guaranteed at runtime, so there are no per-method typeof checks.
 */
interface SocketHealthConnection {
	status: ConnectionStatus;
	lastPing: number;
	reopenNow(): Promise<void>;
	probe(timeoutMs: number): Promise<boolean>;
}

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

export function classifySocketHealth(connection: SocketHealthConnection): SocketRecoveryPlan {
	// Ping age can't vouch for a socket the OS already closed.
	if (connection.status !== 'connected') {
		return 'reopen';
	}
	// The ddp-client heartbeats every 30s (TimeoutControl); a lastPing older
	// than 2x the old SDK's 10s default means the transport is stale.
	const age = Date.now() - connection.lastPing;
	if (age > 20000) {
		return 'reopen';
	}
	// Anything younger is verified by a round trip, never trusted outright: onOpen
	// refreshes lastPing before the handshake reply lands.
	return 'round-trip-check';
}

/**
 * What a recovery attempt reports.
 * - `'confirmed-alive'` — round trip succeeded; nothing was done.
 * - `'reopened'`        — socket reopened (stale ping, or round trip failed).
 * - `'no-socket'`       — `sdk.current?.ddp` undefined; nothing to recover.
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
	const connection = sdk.current?.connection as SocketHealthConnection | undefined;
	if (!connection) {
		return Promise.resolve('no-socket');
	}
	const recovery = (async (): Promise<SocketRecoveryOutcome> => {
		if (classifySocketHealth(connection) === 'reopen') {
			await connection.reopenNow();
			return 'reopened';
		}
		const alive = await connection.probe(2000);
		if (alive) {
			return 'confirmed-alive';
		}
		await connection.reopenNow();
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

/**
 * Vocabulary:
 * - socket health      — the classification concern (`classifySocketHealth`).
 * - recovery plan      — `SocketRecoveryPlan`, the decision.
 * - round trip         — the liveness check (`connection.probe`; our terms
 *                        say round trip).
 * - recovery outcome   — `SocketRecoveryOutcome`, what callers see.
 */
