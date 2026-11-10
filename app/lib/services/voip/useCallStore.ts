import { create } from 'zustand';
import type { CallState, CallContact, CallFeature, CallService, IClientMediaCall } from '@rocket.chat/media-signaling';
import RNCallKeep from 'react-native-callkeep';
import InCallManager from 'react-native-incall-manager';

import { isIOS } from '~/lib/methods/helpers';
import log from '~/lib/methods/helpers/log';
import NativeVoipModule from '~/lib/native/NativeVoip';
import { pendingHangups } from './pendingHangups';
import { terminateNativeCall } from './terminateNativeCall';
import { playCallEndedSound } from './playCallEndedSound';
import { deriveSupportedFeatures } from './deriveSupportedFeatures';
import Navigation from '~/lib/navigation/appNavigation';
import { hideActionSheetRef } from '~/containers/ActionSheet';
import { useIsScreenReaderEnabled } from '~/lib/hooks/useIsScreenReaderEnabled';

const STALE_NATIVE_MS = 60_000;

let callListenersCleanup: (() => void) | null = null;
let staleNativeTimer: ReturnType<typeof setTimeout> | null = null;
/** Call id this timer is for; only `nativeAcceptedCallId` is cleared when it fires, not `callId`. */
let staleNativeScheduledId: string | null = null;

function cleanupCallListeners(): void {
	callListenersCleanup?.();
	callListenersCleanup = null;
}

function cancelStaleNativeTimer(): void {
	if (staleNativeTimer != null) {
		clearTimeout(staleNativeTimer);
		staleNativeTimer = null;
	}
	staleNativeScheduledId = null;
}

function clearStaleNativeIfStillUnbound(get: () => CallStore, scheduled: string): void {
	const st = get();
	if (st.call != null || st.nativeAcceptedCallId !== scheduled) {
		return;
	}
	useCallStore.setState({ nativeAcceptedCallId: null });
}

function createStaleNativeTimer(get: () => CallStore): void {
	cancelStaleNativeTimer();
	const scheduledId = get().nativeAcceptedCallId;
	if (scheduledId == null || scheduledId === '') {
		return;
	}
	staleNativeScheduledId = scheduledId;
	staleNativeTimer = setTimeout(() => {
		staleNativeTimer = null;
		// Timer uses the id from when it was created, not the current module variable.
		if (staleNativeScheduledId === scheduledId) {
			staleNativeScheduledId = null;
		}
		clearStaleNativeIfStillUnbound(get, scheduledId);
	}, STALE_NATIVE_MS);
}

function getRemoteContact(call: IClientMediaCall): CallContact {
	const remoteContact = call.remoteParticipants[0]?.contact;
	return {
		type: remoteContact?.type,
		id: remoteContact?.id,
		uid: remoteContact?.uid,
		displayName: remoteContact?.displayName,
		username: remoteContact?.username,
		sipExtension: remoteContact?.sipExtension
	};
}

function getCallFeatures(call: IClientMediaCall): Pick<CallStoreState, 'service' | 'features'> {
	return { service: call.service, features: deriveSupportedFeatures(call.service, call.features) };
}

interface CallStoreState {
	// Call reference
	call: IClientMediaCall | null;
	callId: string | null;

	/** Survives `reset()` until explicit clear — native-accepted incoming call id. */
	nativeAcceptedCallId: string | null;

	// Call state
	callState: CallState;
	isMuted: boolean;
	isOnHold: boolean;
	remoteMute: boolean;
	remoteHeld: boolean;
	isSpeakerOn: boolean;
	callStartTime: number | null;
	focused: boolean;
	/** The call was escalated to a video conference, by either participant. */
	escalated: boolean;
	/** `cti` calls are carried by an external device; this client only controls them. */
	service: CallService | null;
	/** What the call UI may offer, from the features the server enabled for the call. */
	features: CallFeature[];
	controlsVisible: boolean;
	dialpadValue: string;

	/** DM room id for the current call; cleared on `reset()`. */
	roomId: string | null;

	/** Direction of the current call. */
	direction: 'incoming' | 'outgoing' | null;

	// Contact info
	contact: CallContact;
}

interface CallStoreActions {
	/** Sets native-accepted call id and (re)starts the 15s timer. */
	setNativeAcceptedCallId: (callId: string) => void;
	/** Clears native-accepted id and related state; cancels the timer. */
	resetNativeCallId: () => void;
	setCall: (call: IClientMediaCall) => void;
	toggleMute: () => void;
	toggleHold: () => void;
	toggleSpeaker: () => void;
	toggleControlsVisible: () => void;
	toggleFocus: () => void;
	endCall: () => void;
	/** Clears UI/call fields but keeps nativeAcceptedCallId. Restarts the 15s timer (media init calls reset and clears the old timer first). */
	reset: () => void;
	setDialpadValue: (value: string) => void;
	setRoomId: (roomId: string | null) => void;
	setDirection: (direction: 'incoming' | 'outgoing') => void;
}

export type CallStore = CallStoreState & CallStoreActions;

const initialState: CallStoreState = {
	call: null,
	callId: null,
	nativeAcceptedCallId: null,
	callState: 'none',
	isMuted: false,
	isOnHold: false,
	remoteMute: false,
	remoteHeld: false,
	isSpeakerOn: false,
	callStartTime: null,
	contact: {},
	focused: true,
	escalated: false,
	service: null,
	features: [],
	controlsVisible: true,
	dialpadValue: '',
	roomId: null,
	direction: null
};

export const useCallStore = create<CallStore>((set, get) => ({
	...initialState,

	setNativeAcceptedCallId: (callId: string) => {
		cancelStaleNativeTimer();
		set({ nativeAcceptedCallId: callId });
		createStaleNativeTimer(get);
	},

	resetNativeCallId: () => {
		cancelStaleNativeTimer();
		const { call, callId } = get();
		set({
			nativeAcceptedCallId: null,
			callId: call != null ? callId : null
		});
	},

	setCall: (call: IClientMediaCall) => {
		cleanupCallListeners();
		get().resetNativeCallId();
		// Update state with call info
		const remote = call.remoteParticipants[0];
		set({
			call,
			callId: call.callId,
			callState: call.state,
			isMuted: call.localParticipant.muted,
			isOnHold: call.localParticipant.held,
			remoteMute: remote?.muted ?? false,
			remoteHeld: remote?.held ?? false,
			contact: getRemoteContact(call),
			callStartTime: call.state === 'active' ? (call.activeTimestamp?.getTime() ?? Date.now()) : null,
			escalated: call.escalated,
			...getCallFeatures(call)
		});

		try {
			InCallManager.start({ media: 'audio' });
		} catch (error) {
			log(error);
		}

		if (!isIOS) {
			// Idempotent: native short-circuits if a listener is already registered or API < 31.
			NativeVoipModule.startAudioRouteSync().catch((error: unknown) => {
				log(error);
			});
		}

		// Subscribe to call events
		const handleStateChange = () => {
			const currentCall = get().call;
			if (!currentCall) return;

			const newState = currentCall.state;
			set({ callState: newState, controlsVisible: true, ...getCallFeatures(currentCall) });

			// Set start time when call becomes active
			if (newState === 'active' && !get().callStartTime) {
				set({ callStartTime: Date.now() });
			}

			// Tell CallKit the call is active so iOS shows it in the system UI (lock screen, Control Center, Dynamic Island)
			if (newState === 'active') {
				const { callId, nativeAcceptedCallId } = get();
				RNCallKeep.setCurrentCallActive(callId ?? nativeAcceptedCallId ?? '');
			}
		};

		const handleTrackStateChange = () => {
			const currentCall = get().call;
			if (!currentCall) return;

			const currentRemote = currentCall.remoteParticipants[0];
			set({
				isMuted: currentCall.localParticipant.muted,
				isOnHold: currentCall.localParticipant.held,
				remoteMute: currentRemote?.muted ?? false,
				remoteHeld: currentRemote?.held ?? false,
				controlsVisible: true,
				...getCallFeatures(currentCall)
			});
		};

		// The server updated the call (e.g. a `cti` call's contact or features)
		const handleContactUpdate = () => {
			const currentCall = get().call;
			if (!currentCall) return;

			set({ contact: getRemoteContact(currentCall), ...getCallFeatures(currentCall) });
		};

		const handleEscalated = () => {
			set({ escalated: true, controlsVisible: true, ...getCallFeatures(call) });
		};

		const handleEnded = () => {
			// The server drops the voice call once we are in the conference: end it quietly.
			if (call.hangupReason === 'conference-escalation') {
				const { focused } = get();
				get().resetNativeCallId();
				get().reset();
				if (focused) {
					Navigation.back();
				}
				return;
			}
			playCallEndedSound();
			get().resetNativeCallId();
			get().reset();
			Navigation.back();
		};

		// Another session of this user took the call over; it goes on there.
		const handleHidden = () => {
			const { callId } = get();
			get().resetNativeCallId();
			get().reset();
			if (callId) {
				terminateNativeCall(callId);
			}
			Navigation.back();
		};

		call.emitter.on('stateChange', handleStateChange);
		call.emitter.on('trackStateChange', handleTrackStateChange);
		call.emitter.on('contactUpdate', handleContactUpdate);
		call.emitter.on('ended', handleEnded);
		call.emitter.on('escalated', handleEscalated);
		call.emitter.on('hidden', handleHidden);

		callListenersCleanup = () => {
			call.emitter.off('stateChange', handleStateChange);
			call.emitter.off('trackStateChange', handleTrackStateChange);
			call.emitter.off('contactUpdate', handleContactUpdate);
			call.emitter.off('ended', handleEnded);
			call.emitter.off('escalated', handleEscalated);
			call.emitter.off('hidden', handleHidden);
		};
	},

	toggleControlsVisible: () => {
		set({ controlsVisible: !get().controlsVisible });
	},

	toggleMute: () => {
		const { call, isMuted, features } = get();
		if (!call || !features.includes('mute')) return;

		call.localParticipant.setMuted(!isMuted);
		set({ isMuted: !isMuted });
	},

	toggleHold: () => {
		const { call, isOnHold, features } = get();
		if (!call || !features.includes('hold')) return;

		call.localParticipant.setHeld(!isOnHold);
		set({ isOnHold: !isOnHold });
	},

	toggleSpeaker: async () => {
		const { call, isSpeakerOn } = get();
		if (!call) return;

		const newSpeakerOn = !isSpeakerOn;

		try {
			if (isIOS) {
				await InCallManager.setForceSpeakerphoneOn(newSpeakerOn);
			} else {
				await NativeVoipModule.setSpeakerOn(newSpeakerOn);
			}
			set({ isSpeakerOn: newSpeakerOn });
		} catch (error) {
			log(error);
		}
	},

	toggleFocus: () => {
		const isFocused = get().focused;
		set({ focused: !isFocused, controlsVisible: true });
		if (isFocused) {
			Navigation.back();
		} else {
			Navigation.navigate('CallView');
		}
	},

	setDialpadValue: (value: string) => {
		const { call, features } = get();
		if (!call || !features.includes('dialpad')) return;

		call.sendDTMF(value);
		const newValue = get().dialpadValue + value;
		set({ dialpadValue: newValue });
	},

	setRoomId: (roomId: string | null) => {
		set({ roomId });
	},

	setDirection: (direction: 'incoming' | 'outgoing') => {
		set({ direction });
	},

	endCall: () => {
		const { call, callId, nativeAcceptedCallId } = get();
		// UUID for the native call UI layer (react-native-callkeep on iOS and Android).
		const callUuid = callId ?? nativeAcceptedCallId;

		if (callId) {
			// Record before dispatching so a hangup written into a dead socket is replayed on reconnect.
			pendingHangups.record(callId);
		}

		if (call) {
			call.hangup();
		}

		if (callUuid) {
			terminateNativeCall(callUuid);
		}

		playCallEndedSound();
		get().resetNativeCallId();
		get().reset();
	},

	reset: () => {
		const { nativeAcceptedCallId } = get();
		cleanupCallListeners();
		cancelStaleNativeTimer();
		try {
			InCallManager.stop();
		} catch (error) {
			log(error);
		}
		set({ ...initialState, nativeAcceptedCallId });
		hideActionSheetRef();
		if (!isIOS) {
			NativeVoipModule.stopAudioRouteSync().catch((error: unknown) => {
				log(error);
			});
		}
		// Old timer was cleared above; start a new one if nativeAcceptedCallId is still set.
		createStaleNativeTimer(get);
	}
}));

export const useCallContact = () => useCallStore(state => state.contact);
/** SIP calls are escalated by the server; calls between two users switch to a conference in their DM. */
export const isSipCall = (call: IClientMediaCall | null): boolean => call?.remoteParticipants[0]?.contact?.type === 'sip';
/** True when the active call can switch to video (re-evaluated on call state changes). */
export const useCanEscalateToVideo = () =>
	useCallStore(
		state =>
			state.callState === 'active' &&
			!state.escalated &&
			state.features.includes('conference-escalation') &&
			(isSipCall(state.call) || state.roomId != null)
	);
export const useIsCallEscalated = () => useCallStore(state => state.escalated);
export const useCallFeature = (feature: CallFeature) => useCallStore(state => state.features.includes(feature));
export const useIsControlOnlyCall = () => useCallStore(state => state.service === 'cti');
export const useDialpadValue = () => useCallStore(state => state.dialpadValue);
export const useControlsVisible = () => {
	const controlsVisible = useCallStore(state => state.controlsVisible);
	const isScreenReaderEnabled = useIsScreenReaderEnabled();
	return controlsVisible || isScreenReaderEnabled;
};
