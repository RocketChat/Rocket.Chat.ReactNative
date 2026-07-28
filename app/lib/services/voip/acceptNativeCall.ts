import log from '../../methods/helpers/log';
import sdk from '../sdk';
import { waitForLoginReady } from '../waitForLoginReady';
import { terminateNativeCall } from './terminateNativeCall';
import { useCallStore } from './useCallStore';

export interface NativeCallMediaSession {
	applyRestStateSignals(): Promise<void>;
	answerCall(callId: string): Promise<void>;
	endCall(callId: string): void;
	isInitialized(): boolean;
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
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(signal as any).onabort = callback;
	}
}

async function waitForMediaSignalSubs(ddp: any, timeoutMs: number, abortSignal?: AbortSignal): Promise<boolean> {
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
		activeGates.delete(callId);
	};

	try {
		const ddp = sdk.current?.ddp;
		if (!ddp || typeof ddp.reopenNow !== 'function' || typeof ddp.probe !== 'function' || ddp.lastPing == null) {
			return handleFailure(callId, mediaSession);
		}

		const pingInterval = ((ddp.pingInterval ?? ddp.config?.ping) || 10000) as number;
		const age = Date.now() - ddp.lastPing;

		if (age > pingInterval * 2) {
			await ddp.reopenNow();
		} else if (age > pingInterval) {
			const alive = await ddp.probe(2000);
			if (!alive) {
				await ddp.reopenNow();
			}
		}

		if (controller.signal.aborted) {
			return handleFailure(callId, mediaSession);
		}

		const [loginReady, mediaSubsReady] = await Promise.all([
			waitForLoginReady(8000, controller.signal),
			waitForMediaSignalSubs(ddp, 8000, controller.signal)
		]);

		if (!loginReady || !mediaSubsReady || !mediaSession.isInitialized() || controller.signal.aborted) {
			return handleFailure(callId, mediaSession);
		}

		await mediaSession.applyRestStateSignals();

		if (controller.signal.aborted) {
			return handleFailure(callId, mediaSession);
		}

		const { call } = useCallStore.getState();
		if (call?.callId !== callId) {
			await mediaSession.answerCall(callId);
		}
	} finally {
		cleanup();
	}
}
