// Model of the VoIP native-accept flow for one incoming call that native (CallKit / Telecom) already
// answered over REST. Every action cites the code it mirrors; one action = one synchronous JS segment.

type Start = 'warm' | 'cold';
type SdkCall = 'unknown' | 'pending' | 'accepted' | 'hangup';
type Gate = 'idle' | 'waitReady' | 'waitReplay';

const MAX_GATE_STARTS = 3;
const MAX_UNGATED_REPLAYS = 2;

/** Warm: app in foreground, session up. Cold: app killed, JS boots after native accepted. */
let start!: Start;

/** CallKit / Telecom call for this callId. terminateNativeCall ends it. */
let systemCallEnded = false;
/** Server-side call: ended once this device sends reject/hangup for it. */
let serverCallEnded = false;
/** ClientMediaCall state in the MediaSignalingSession (getCallData). Warm: the DDP offer may have arrived before accept. */
let sdkCall!: SdkCall;
/** MediaSessionInstance.instance != null */
let sessionReady!: boolean;

/** useCallStore.nativeAcceptedCallId === callId */
let nativeAcceptedId = false;
/** useCallStore.call is this call: the app bound it, opened CallView and started media. */
let bound = false;

/** Latest acceptNativeCallWithReadiness for this callId (older ones are aborted via activeGates). */
let gate: Gate = 'idle';
let gateStarts = 0;
/** applyRestStateSignals runs not awaited by the live gate (init replay, or an aborted gate's). */
let ungatedReplays = 0;

let acceptEventDelivered = false;
let initDone = false;
let ddpAcceptedDelivered = false;
let staleTimerFired = false;

/** Ghost: the user pressed End on the system call UI. */
let userEnded = false;
/** Ghost: the "VoIP_Answer_Failed" alert was shown. */
let answerFailedAlert = false;

/** @initially */
export const initialState = () =>
	start === 'warm' ? sessionReady && sdkCall !== 'accepted' && sdkCall !== 'hangup' : !sessionReady && sdkCall === 'unknown';

// --- helpers mirroring app code -------------------------------------------------------------

/** acceptNativeCall.ts — a new gate aborts the previous one for the same callId. */
const startGate = () => {
	if (gate === 'waitReplay') {
		// The aborted gate's applyRestStateSignals keeps running; only its continuation stops.
		ungatedReplays += 1;
	}
	gate = 'waitReady';
	gateStarts += 1;
};

/** MediaSessionInstance.ts endCall(callId). */
const sessionEndCall = () => {
	if (sdkCall === 'pending' || sdkCall === 'accepted') {
		// ringing → reject(), otherwise hangup(); both move the SDK call to hangup and tell the server.
		sdkCall = 'hangup';
		serverCallEnded = true;
	}
	systemCallEnded = true;
	nativeAcceptedId = false;
	bound = false;
};

/** MediaSessionInstance.ts answerCall(callId). accept() is synchronous in the SDK. */
const answerCall = () => {
	if (bound) return;
	if (sdkCall === 'pending') {
		// Call.js accept(): acceptedRemotely is already true (native REST answer), so state → accepted.
		sdkCall = 'accepted';
		bound = true; // setCall → resetNativeCallId
		nativeAcceptedId = false;
		return;
	}
	if (sdkCall === 'unknown') {
		// "Call not found after accept"
		systemCallEnded = true;
		nativeAcceptedId = false;
		return;
	}
	// accept() throws call-not-pending-acceptance
	systemCallEnded = true;
	nativeAcceptedId = false;
	answerFailedAlert = true;
};

/**
 * MediaSessionInstance.ts applyRestStateSignals: replays media-calls.stateSignals, then
 * MediaSessionInstance.ts tryAnswerIfNativeAcceptedNotification (ungated) per signal.
 */
const replayStateSignals = () => {
	if (!sessionReady) return;
	if (serverCallEnded) return; // the server no longer lists the call
	if (sdkCall === 'unknown') sdkCall = 'pending';
	if (nativeAcceptedId && !bound) answerCall();
};

// --- events ---------------------------------------------------------------------------------

/** MediaCallEvents.ts VoipAcceptSucceeded, host matches the active workspace. */
export const voipAcceptSucceeded = () => {
	if (start !== 'warm' || acceptEventDelivered) return;
	acceptEventDelivered = true;
	nativeAcceptedId = true;
	startGate();
};

/** MediaCallEvents.ts getInitialMediaCallEvents, iOS, answered, same workspace. */
export const coldStartInitialEvents = () => {
	if (start !== 'cold' || acceptEventDelivered) return;
	acceptEventDelivered = true;
	nativeAcceptedId = true;
	startGate();
};

/** MediaSessionInstance.ts init(userId) after login on cold start. */
export const sessionInit = () => {
	if (start !== 'cold' || initDone || !acceptEventDelivered) return;
	initDone = true;
	// reset() → useCallStore.reset() keeps nativeAcceptedCallId; mediaSessionStore.dispose()
	bound = false;
	sdkCall = 'unknown';
	sessionReady = true;
	if (nativeAcceptedId) {
		startGate();
	} else {
		if (ungatedReplays >= MAX_UNGATED_REPLAYS) return;
		ungatedReplays += 1;
	}
};

/**
 * acceptNativeCall.ts — recoverSocket, waitForLoginReady and media subs resolve.
 * `ready` false covers no-socket, missing driver, and the 8 s timeouts.
 */
export const gateReady = (ready: boolean) => {
	if (gate !== 'waitReady') return;
	if (!ready || !sessionReady) {
		// handleFailure: terminateNativeCall, resetNativeCallId, mediaSession.endCall
		gate = 'idle';
		sessionEndCall();
		return;
	}
	gate = 'waitReplay';
};

/** acceptNativeCall.ts — the gate's replay resolves, then answerCall if the call is unbound. */
export const gateReplayDone = () => {
	if (gate !== 'waitReplay') return;
	gate = 'idle';
	replayStateSignals();
	if (!bound) answerCall();
};

/** A replay not awaited by the live gate resolves (its tryAnswer still runs). */
export const ungatedReplayDone = () => {
	if (ungatedReplays === 0) return;
	ungatedReplays -= 1;
	replayStateSignals();
};

/** MediaSessionInstance.ts stream-notify-user media-signal notification/accepted (gated tryAnswer). */
export const ddpAcceptedNotification = () => {
	if (ddpAcceptedDelivered || !sessionReady || serverCallEnded) return;
	if (gateStarts >= MAX_GATE_STARTS) return;
	ddpAcceptedDelivered = true;
	if (sdkCall === 'unknown') sdkCall = 'pending';
	if (nativeAcceptedId && !bound) startGate();
};

/** useCallStore.ts — 60 s after nativeAcceptedCallId was set, clear it if still unbound. */
export const staleNativeTimer = () => {
	if (staleTimerFired || !nativeAcceptedId) return;
	staleTimerFired = true;
	if (!bound) nativeAcceptedId = false;
};

/** MediaCallEvents.ts — iOS RNCallKeep endCall: the user presses End in CallKit. */
export const userEndsInSystemUi = () => {
	if (userEnded || systemCallEnded) return;
	userEnded = true;
	if (start === 'cold' && !acceptEventDelivered) {
		// JS is not running yet: CallKit ends the call and no endCall listener sees it.
		systemCallEnded = true;
		return;
	}
	sessionEndCall();
};

// --- rules ----------------------------------------------------------------------------------

/** A call the user ended from the system call UI is never connected by the app afterwards. */
export const noConnectAfterUserEnd = () => !(userEnded && bound);

/** Witness, expected to break: a break proves the app can connect a call the user did not end. */
export const neverConnects = () => userEnded || !bound;

/** @terminating */
export const settled = () => gate === 'idle' && ungatedReplays === 0;
