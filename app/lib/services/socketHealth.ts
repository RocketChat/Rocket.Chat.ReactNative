import { onAbort } from '../methods/helpers/onAbort';
import sdk from './sdk';

/**
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
		if (!driver.connected) {
			await driver.reopenNow();
			return 'reopened';
		}
		// A connected socket is still verified by a round trip, never trusted outright:
		// `connected` already folds in the ping-age test, but onOpen refreshes lastPing
		// before the handshake reply lands.
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
