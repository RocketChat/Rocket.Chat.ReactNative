import log from '~/lib/methods/helpers/log';
import { onAbort } from '~/lib/methods/helpers/onAbort';
import sdk, { type ISocketDriver } from '../sdk';
import { waitForLoginReady } from '../waitForLoginReady';
import { recoverSocket } from '../socketHealth';
import { terminateNativeCall } from './terminateNativeCall';
import { useCallStore } from './useCallStore';
import { voipDebugLog } from './voipDebugLog';
import { store as reduxStore } from '~/lib/store/auxStore';

const TAG = 'AcceptGate';

export interface NativeCallMediaSession {
	applyRestStateSignals(): Promise<void>;
	answerCall(callId: string): Promise<void>;
	endCall(callId: string): void;
	isInitialized(): boolean;
	getCallDebugInfo?(callId: string): unknown;
}

const activeGates = new Map<string, AbortController>();

function snapshot(callId: string, mediaSession: NativeCallMediaSession): Record<string, unknown> {
	try {
		const { login, meteor } = reduxStore.getState();
		const { call, callId: storeCallId, nativeAcceptedCallId, callState, direction } = useCallStore.getState();
		let driverConnected: boolean | string;
		try {
			driverConnected = sdk.driver ? sdk.driver.connected : 'no-driver';
		} catch (error) {
			driverConnected = `error: ${(error as Error)?.message}`;
		}
		return {
			callId,
			driverConnected,
			isAuthenticated: login.isAuthenticated,
			meteorConnected: meteor.connected,
			sessionInitialized: mediaSession.isInitialized(),
			libCall: mediaSession.getCallDebugInfo?.(callId),
			store: { storeCallId, boundCallId: call?.callId ?? null, nativeAcceptedCallId, callState, direction },
			activeGates: [...activeGates.keys()]
		};
	} catch (error) {
		return { callId, snapshotError: (error as Error)?.message };
	}
}

async function waitForMediaSignalSubs(driver: ISocketDriver, timeoutMs: number, abortSignal?: AbortSignal): Promise<boolean> {
	if (abortSignal?.aborted) {
		return false;
	}

	const aborted = new Promise<boolean>(resolve => {
		onAbort(abortSignal, () => resolve(false));
	});

	const startedAt = Date.now();
	try {
		const ready = await Promise.race([driver.waitForNotifyUserMediaSubs(timeoutMs), aborted]);
		voipDebugLog(TAG, 'waitForNotifyUserMediaSubs settled', {
			ready,
			aborted: abortSignal?.aborted ?? false,
			elapsedMs: Date.now() - startedAt,
			timeoutMs
		});
		return ready;
	} catch (error) {
		voipDebugLog(TAG, 'waitForNotifyUserMediaSubs threw', { error, elapsedMs: Date.now() - startedAt }, 'error');
		log(error);
		return false;
	}
}

function handleFailure(
	callId: string,
	mediaSession: NativeCallMediaSession,
	reason: string,
	details?: Record<string, unknown>
): void {
	voipDebugLog(TAG, `handleFailure: ${reason}`, { ...details, ...snapshot(callId, mediaSession) }, 'error');
	terminateNativeCall(callId);
	useCallStore.getState().resetNativeCallId();
	mediaSession.endCall(callId);
}

export async function acceptNativeCallWithReadiness(callId: string, mediaSession: NativeCallMediaSession): Promise<void> {
	const gateStartedAt = Date.now();
	const elapsed = () => Date.now() - gateStartedAt;
	voipDebugLog(TAG, 'gate start', snapshot(callId, mediaSession));
	const previous = activeGates.get(callId);
	if (previous) {
		voipDebugLog(TAG, 'aborting previous gate for same callId', { callId });
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
		voipDebugLog(TAG, 'recoverSocket outcome', { callId, outcome, elapsedMs: elapsed() });
		if (outcome === 'no-socket') {
			return handleFailure(callId, mediaSession, 'recoverSocket returned no-socket', { elapsedMs: elapsed() });
		}
		if (outcome === 'abandoned') {
			voipDebugLog(TAG, 'gate abandoned during recoverSocket', { callId, elapsedMs: elapsed() });
			return;
		}

		if (controller.signal.aborted) {
			voipDebugLog(TAG, 'gate aborted after recoverSocket', { callId, elapsedMs: elapsed() });
			return;
		}

		const driver = sdk.driver;
		if (!driver) {
			return handleFailure(callId, mediaSession, 'sdk.driver missing after recoverSocket', { outcome, elapsedMs: elapsed() });
		}

		const [loginReady, mediaSubsReady] = await Promise.all([
			waitForLoginReady(8000, controller.signal),
			waitForMediaSignalSubs(driver, 8000, controller.signal)
		]);

		const sessionInitialized = mediaSession.isInitialized();
		const readiness = { socketOutcome: outcome, loginReady, mediaSubsReady, sessionInitialized, elapsedMs: elapsed() };
		voipDebugLog(TAG, 'readiness settled', { callId, aborted: controller.signal.aborted, ...readiness });

		if (controller.signal.aborted) {
			return;
		}

		if (!loginReady || !mediaSubsReady || !sessionInitialized) {
			const unmet = Object.entries({ loginReady, mediaSubsReady, sessionInitialized })
				.filter(([, ready]) => !ready)
				.map(([name]) => name)
				.join(', ');
			return handleFailure(callId, mediaSession, `readiness not met: ${unmet}`, readiness);
		}

		await mediaSession.applyRestStateSignals();
		voipDebugLog(TAG, 'applyRestStateSignals done', { elapsedMs: elapsed(), ...snapshot(callId, mediaSession) });

		if (controller.signal.aborted) {
			voipDebugLog(TAG, 'gate aborted after applyRestStateSignals', { callId, elapsedMs: elapsed() });
			return;
		}

		const { call } = useCallStore.getState();
		const alreadyBound = call?.callId === callId;
		voipDebugLog(TAG, alreadyBound ? 'call already bound, skipping answerCall' : 'calling answerCall', {
			callId,
			elapsedMs: elapsed()
		});
		if (!alreadyBound) {
			await mediaSession.answerCall(callId);
		}
		voipDebugLog(TAG, 'gate done', { elapsedMs: elapsed(), ...snapshot(callId, mediaSession) });
	} catch (error) {
		voipDebugLog(TAG, 'gate threw', { callId, error, aborted: controller.signal.aborted, elapsedMs: elapsed() }, 'error');
		log(error);
		if (!controller.signal.aborted) {
			handleFailure(callId, mediaSession, 'gate threw', { error, elapsedMs: elapsed() });
		}
	} finally {
		cleanup();
	}
}
