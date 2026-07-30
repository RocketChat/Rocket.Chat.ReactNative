import log from '../../methods/helpers/log';
import sdk from '../sdk';
import { waitForLoginReady } from '../waitForLoginReady';
import { classifySocketHealth } from '../socketHealth';
import { terminateNativeCall } from './terminateNativeCall';
import { useCallStore } from './useCallStore';

export interface NativeCallMediaSession {
	applyRestStateSignals(): Promise<void>;
	answerCall(callId: string): Promise<void>;
	endCall(callId: string): void;
	isInitialized(): boolean;
}

interface VoipReadyDdp {
	reopenNow(): Promise<void>;
	probe(timeoutMs: number): Promise<boolean>;
	lastPing: number;
	pingInterval?: number;
	config?: { ping?: number };
	waitForNotifyUserMediaSubs(timeoutMs: number): Promise<boolean>;
}

const activeGates = new Map<string, AbortController>();

function onAbort(signal: AbortSignal | undefined, callback: () => void): void {
	if (!signal) {
		return;
	}
	if (signal.aborted) {
		callback();
		return;
	}
	if ('addEventListener' in signal) {
		signal.addEventListener('abort', callback, { once: true });
	} else {
		// Fallback for older runtimes where AbortSignal only exposes onabort.
		const legacy = signal as unknown as { onabort: (() => void) | null };
		legacy.onabort = callback;
	}
}

async function waitForMediaSignalSubs(ddp: VoipReadyDdp, timeoutMs: number, abortSignal?: AbortSignal): Promise<boolean> {
	if (typeof ddp.waitForNotifyUserMediaSubs !== 'function') {
		return false;
	}
	if (abortSignal?.aborted) {
		return false;
	}

	const ready = ddp.waitForNotifyUserMediaSubs(timeoutMs);
	const aborted = new Promise<boolean>(resolve => {
		onAbort(abortSignal, () => resolve(false));
	});

	try {
		return await Promise.race([ready, aborted]);
	} catch (error) {
		log(error);
		return false;
	}
}

function handleFailure(callId: string, mediaSession: NativeCallMediaSession): void {
	terminateNativeCall(callId);
	useCallStore.getState().resetNativeCallId();
	mediaSession.endCall(callId);
}

export async function acceptNativeCallWithReadiness(callId: string, mediaSession: NativeCallMediaSession): Promise<void> {
	const previous = activeGates.get(callId);
	if (previous) {
		previous.abort();
	}

	const controller = new AbortController();
	activeGates.set(callId, controller);
	const cleanup = () => {
		if (activeGates.get(callId) === controller) {
			activeGates.delete(callId);
		}
	};

	try {
		const ddp = sdk.current?.ddp as VoipReadyDdp | undefined;
		if (!ddp || typeof ddp.reopenNow !== 'function' || typeof ddp.probe !== 'function' || ddp.lastPing == null) {
			return handleFailure(callId, mediaSession);
		}

		const action = classifySocketHealth(ddp);
		if (action === 'reopen') {
			await ddp.reopenNow();
		} else {
			// A stored timestamp can't vouch for a socket the OS may have frozen.
			const alive = await ddp.probe(2000);
			if (!alive) {
				await ddp.reopenNow();
			}
		}

		if (controller.signal.aborted) {
			return;
		}

		const [loginReady, mediaSubsReady] = await Promise.all([
			waitForLoginReady(8000, controller.signal),
			waitForMediaSignalSubs(ddp, 8000, controller.signal)
		]);

		if (controller.signal.aborted) {
			return;
		}

		if (!loginReady || !mediaSubsReady || !mediaSession.isInitialized()) {
			return handleFailure(callId, mediaSession);
		}

		await mediaSession.applyRestStateSignals();

		if (controller.signal.aborted) {
			return;
		}

		const { call } = useCallStore.getState();
		if (call?.callId !== callId) {
			await mediaSession.answerCall(callId);
		}
	} catch (error) {
		log(error);
		if (!controller.signal.aborted) {
			handleFailure(callId, mediaSession);
		}
	} finally {
		cleanup();
	}
}
