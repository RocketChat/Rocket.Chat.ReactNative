import log from '../../methods/helpers/log';
import { onAbort } from '../../methods/helpers/onAbort';
import sdk, { type TDriver } from '../sdk';
import { waitForLoginReady } from '../waitForLoginReady';
import { recoverSocket } from '../socketHealth';
import { terminateNativeCall } from './terminateNativeCall';
import { useCallStore } from './useCallStore';

export interface NativeCallMediaSession {
	applyRestStateSignals(): Promise<void>;
	answerCall(callId: string): Promise<void>;
	endCall(callId: string): void;
	isInitialized(): boolean;
}

const activeGates = new Map<string, AbortController>();

async function waitForMediaSignalSubs(ddp: TDriver, timeoutMs: number, abortSignal?: AbortSignal): Promise<boolean> {
	if (abortSignal?.aborted) {
		return false;
	}

	const aborted = new Promise<boolean>(resolve => {
		onAbort(abortSignal, () => resolve(false));
	});

	try {
		return await Promise.race([ddp.waitForNotifyUserMediaSubs(timeoutMs), aborted]);
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
		const outcome = await recoverSocket({ abortSignal: controller.signal });
		if (outcome === 'no-socket') {
			return handleFailure(callId, mediaSession);
		}
		if (outcome === 'abandoned') {
			return;
		}

		if (controller.signal.aborted) {
			return;
		}

		const ddp = sdk.current?.driver;
		if (!ddp) {
			return handleFailure(callId, mediaSession);
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
