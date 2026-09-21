import { AppState, type AppStateStatus, type NativeEventSubscription } from 'react-native';
import RNCallKeep from 'react-native-callkeep';
import InCallManager from 'react-native-incall-manager';
import { RTCAudioSession } from 'react-native-webrtc';

import {
	VIDEOCONF_AUDIO_HANDOFF,
	VIDEOCONF_HANDOFF_HOLDS_NATIVE_CALL,
	VIDEOCONF_HANDOFF_RELEASES_CAPTURE,
	VIDEOCONF_HANDOFF_STOPS_IOS_AUDIO_UNIT
} from '~/lib/constants/callWaiting';
import { isIOS } from '~/lib/methods/helpers';
import log from '~/lib/methods/helpers/log';
import NativeVoipModule from '~/lib/native/NativeVoip';
import { resumeCapture, suspendCapture } from './captureGate';
import { MediaCallLogger } from './MediaCallLogger';
import { useCallStore } from './useCallStore';

/**
 * PoC: hand the microphone over from an active VoIP call to a video conference, and take it
 * back afterwards, without ending the VoIP call.
 *
 * Provider-agnostic on purpose. Jitsi renders in-app (`JitsiMeetView`); every other provider —
 * Pexip included — goes through `openLink`, which is either an in-app browser or an external
 * one. Both paths call the same two functions here.
 *
 * Three independent steps, each behind its own flag so they can be A/B'd on device:
 *  1. capture — gate `getUserMedia` and stop the WebRTC input track
 *  2. native  — CallKit/Telecom hold + drop the audio session
 *  3. iOS     — stop the WebRTC audio unit, which is what actually frees the microphone hardware
 */

const TAG = '[VoipAudioHandoff]';
const mediaCallLogger = new MediaCallLogger();

/** Call UUID currently yielded, or null. Guards against double yield/reclaim. */
let yieldedCallUuid: string | null = null;
/** Hold state before the handoff, so a user-initiated hold is not resumed by us. */
let heldBeforeYield = false;
/** Speaker state before the handoff. */
let speakerBeforeYield = false;
let appStateSubscription: NativeEventSubscription | null = null;
let reclaimFallbackTimer: ReturnType<typeof setTimeout> | null = null;

/** Milliseconds to wait for an external browser to background us before assuming it never will. */
const EXTERNAL_HANDOFF_SETTLE_MS = 750;
/** Milliseconds to wait for CallKit to reactivate the audio session after unhold before re-enabling WebRTC audio anyway. */
const AUDIO_SESSION_ACTIVATION_TIMEOUT_MS = 1500;
let iosAudioUnitStopped = false;
let cancelActivationWait: (() => void) | null = null;

export function isVoipAudioYielded(): boolean {
	return yieldedCallUuid != null;
}

/** The private input-track surface of `MediaSignalingSession` that the PoC reaches into. */
type CaptureSession = {
	setInputTrack?: (track: MediaStreamTrack | null) => Promise<void>;
	startInputTrack?: () => Promise<void>;
};

/**
 * Suspends or restores the shared capture track. `MediaSignalingSession.setInputTrack` is the only
 * code path that calls `track.stop()`, and it is private — this reach-in is the PoC stand-in for a
 * public `suspendInput()` / `resumeInput()` in `@rocket.chat/media-signaling`.
 *
 * Durability comes from the gate, not from stopping the track: `Session.updateState()` re-runs
 * `getUserMedia` on every state change while a call is busy, and hold does not change that. With
 * the gate suspended those requests park, and the session's `callsToGetUserMedia` guard keeps it
 * from issuing more.
 */
async function setCaptureSuspended(suspended: boolean): Promise<void> {
	// Required lazily: a static import would pull the ESM-only `@rocket.chat/media-signaling`
	// into every module graph that reaches a videoconf join.
	// eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
	const { mediaSessionStore } = require('./MediaSessionStore');

	const session = mediaSessionStore.getCurrentInstance() as CaptureSession | null;

	if (suspended) {
		suspendCapture();
		if (!session) {
			return;
		}
		try {
			await session.setInputTrack?.(null);
		} catch (error) {
			log(error);
		}
		return;
	}

	// A parked request resumes on its own; starting another would leak the first stream, since the
	// session only keeps the output of the last concurrent `getUserMedia`.
	const released = resumeCapture();
	if (released > 0 || !session) {
		return;
	}
	try {
		await session.startInputTrack?.();
	} catch (error) {
		log(error);
	}
}

/**
 * iOS: stopping the send track leaves WebRTC's VoiceProcessingIO unit running for playout, and
 * that unit keeps the microphone hardware. Manual audio mode lets us tear it down while the peer
 * connection stays alive.
 */
function setIosAudioUnitStopped(stopped: boolean): void {
	if (!isIOS || !VIDEOCONF_HANDOFF_STOPS_IOS_AUDIO_UNIT) {
		return;
	}
	try {
		if (stopped) {
			NativeVoipModule.setWebRTCManualAudio(true);
			NativeVoipModule.setWebRTCAudioEnabled(false);
			iosAudioUnitStopped = true;
		} else {
			NativeVoipModule.setWebRTCAudioEnabled(true);
			NativeVoipModule.setWebRTCManualAudio(false);
			iosAudioUnitStopped = false;
		}
	} catch (error) {
		log(error);
	}
}

/** Resolves on CallKit's `didActivateAudioSession`, or after a timeout when it never comes (user-held call). */
function waitForAudioSessionActivation(): Promise<void> {
	return new Promise(resolve => {
		let done = false;
		const finish = () => {
			if (done) {
				return;
			}
			done = true;
			clearTimeout(timer);
			subscription?.remove();
			cancelActivationWait = null;
			resolve();
		};
		cancelActivationWait?.();
		cancelActivationWait = finish;
		const subscription = RNCallKeep.addEventListener('didActivateAudioSession', finish);
		const timer = setTimeout(finish, AUDIO_SESSION_ACTIVATION_TIMEOUT_MS);
	});
}

/**
 * Releases the platform audio session. On iOS the CallKit hold is what makes the OS deactivate
 * it; the `RTCAudioSession` call is advisory while `react-native-webrtc` runs in automatic mode
 * (it exposes no `useManualAudio`).
 */
function setCallAudioSessionActive(active: boolean): void {
	try {
		if (active) {
			InCallManager.start({ media: 'audio' });
		} else {
			InCallManager.stop();
		}
	} catch (error) {
		log(error);
	}

	if (isIOS) {
		try {
			if (active) {
				RTCAudioSession.audioSessionDidActivate();
			} else {
				RTCAudioSession.audioSessionDidDeactivate();
			}
		} catch (error) {
			log(error);
		}
		if (!active) {
			setIosAudioUnitStopped(true);
		}
		return;
	}

	const routing = active
		? NativeVoipModule.startAudioRouteSync().then(() => NativeVoipModule.setSpeakerOn(speakerBeforeYield))
		: NativeVoipModule.setSpeakerOn(false).then(() => NativeVoipModule.stopAudioRouteSync());

	routing.catch((error: unknown) => {
		log(error);
	});
}

/**
 * Releases the microphone for a video conference. Returns true when a handoff happened, so the
 * caller knows it owns a matching {@link reclaimVoipAudio}.
 */
export async function yieldVoipAudio(reason: string): Promise<boolean> {
	if (!VIDEOCONF_AUDIO_HANDOFF) {
		return false;
	}

	const { call, callId, nativeAcceptedCallId, isOnHold, isSpeakerOn } = useCallStore.getState();
	const callUuid = callId ?? nativeAcceptedCallId;
	if (!call || !callUuid) {
		return false;
	}
	if (yieldedCallUuid === callUuid) {
		return true;
	}

	mediaCallLogger.log(`${TAG} yield for ${reason} (call ${callUuid})`);
	yieldedCallUuid = callUuid;
	heldBeforeYield = isOnHold;
	speakerBeforeYield = isSpeakerOn;

	// Capture first: the hold below changes session state, which re-requests the input track,
	// and that request must park behind the gate instead of reopening the microphone.
	if (VIDEOCONF_HANDOFF_RELEASES_CAPTURE) {
		await setCaptureSuspended(true);
	}

	if (VIDEOCONF_HANDOFF_HOLDS_NATIVE_CALL) {
		if (!isOnHold) {
			// Signaling hold first: the `didToggleHoldCallAction` listener in MediaCallEvents is
			// guarded on `isOnHold`, so it no-ops on the CallKit event `setOnHold` triggers.
			call.localParticipant.setHeld(true);
			useCallStore.setState({ isOnHold: true });
			RNCallKeep.setOnHold(callUuid, true);
		}
		setCallAudioSessionActive(false);
	}

	return true;
}

/** Takes the microphone back. Safe to call when nothing was yielded. */
export async function reclaimVoipAudio(reason: string): Promise<void> {
	clearPendingReclaim();

	const callUuid = yieldedCallUuid;
	if (!callUuid) {
		return;
	}
	yieldedCallUuid = null;

	const { call, callId, nativeAcceptedCallId } = useCallStore.getState();
	// The call may have ended, or been replaced, while the videoconf was up.
	if (!call || (callId ?? nativeAcceptedCallId) !== callUuid) {
		return;
	}

	mediaCallLogger.log(`${TAG} reclaim after ${reason} (call ${callUuid})`);

	if (VIDEOCONF_HANDOFF_RELEASES_CAPTURE) {
		await setCaptureSuspended(false);
	}

	if (!VIDEOCONF_HANDOFF_HOLDS_NATIVE_CALL) {
		return;
	}

	const unhold = () => {
		if (!heldBeforeYield) {
			RNCallKeep.setOnHold(callUuid, false);
			call.localParticipant.setHeld(false);
			useCallStore.setState({ isOnHold: false });
			RNCallKeep.setCurrentCallActive(callUuid);
		}
	};

	if (!iosAudioUnitStopped) {
		setCallAudioSessionActive(true);
		unhold();
		return;
	}

	// CallKit reactivates the audio session only after the unhold, so the WebRTC audio unit has to
	// come back afterwards. Not awaited: the rest of the reclaim must not wait on CallKit.
	const activation = waitForAudioSessionActivation();
	unhold();
	activation
		.then(() => {
			setCallAudioSessionActive(true);
			setIosAudioUnitStopped(false);
		})
		.catch(log);
}

function clearPendingReclaim(): void {
	appStateSubscription?.remove();
	appStateSubscription = null;
	if (reclaimFallbackTimer != null) {
		clearTimeout(reclaimFallbackTimer);
		reclaimFallbackTimer = null;
	}
}

/**
 * Reclaim path for the out-of-app providers (Pexip and friends go through `openLink`).
 *
 * `WebBrowser.openBrowserAsync` resolves on dismissal, so the app is already back. An external
 * browser opened with `Linking.openURL` resolves immediately and backgrounds us instead — that
 * case reclaims on the next foreground.
 */
export function reclaimVoipAudioOnAppReturn(reason: string): void {
	if (!isVoipAudioYielded()) {
		return;
	}

	clearPendingReclaim();

	let leftForeground = false;

	appStateSubscription = AppState.addEventListener('change', (state: AppStateStatus) => {
		if (state !== 'active') {
			leftForeground = true;
			return;
		}
		if (leftForeground) {
			reclaimVoipAudio(reason).catch(log);
		}
	});

	reclaimFallbackTimer = setTimeout(() => {
		reclaimFallbackTimer = null;
		if (!leftForeground && AppState.currentState === 'active') {
			reclaimVoipAudio(reason).catch(log);
		}
	}, EXTERNAL_HANDOFF_SETTLE_MS);
}

/** Drops handoff state without touching the call — for teardown when the call is already gone. */
export function resetVoipAudioHandoff(): void {
	clearPendingReclaim();
	yieldedCallUuid = null;
	heldBeforeYield = false;
	speakerBeforeYield = false;
	resumeCapture();
	cancelActivationWait?.();
	if (iosAudioUnitStopped) {
		setIosAudioUnitStopped(false);
	}
}

// A call that ends while the microphone is yielded leaves nothing to reclaim to.
useCallStore.subscribe(state => {
	if (state.call == null && isVoipAudioYielded()) {
		resetVoipAudioHandoff();
	}
});
