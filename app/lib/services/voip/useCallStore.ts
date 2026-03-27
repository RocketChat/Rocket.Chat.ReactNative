import { create } from 'zustand';
import type { CallState, CallContact, IClientMediaCall } from '@rocket.chat/media-signaling';
import RNCallKeep from 'react-native-callkeep';
import InCallManager from 'react-native-incall-manager';

import Navigation from '../../navigation/appNavigation';
import { hideActionSheetRef } from '../../../containers/ActionSheet';

const STALE_NATIVE_MS = 15_000;

let callListenersCleanup: (() => void) | null = null;
let staleNativeTimer: ReturnType<typeof setTimeout> | null = null;
/** Id this timer may clear; must match `nativeAcceptedCallId` at fire time. */
let staleNativeScheduledId: string | null = null;

export function cleanupCallListeners(): void {
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

function armStaleNativeTimer(get: () => CallStore): void {
	cancelStaleNativeTimer();
	const scheduledId = get().nativeAcceptedCallId;
	if (scheduledId == null || scheduledId === '') {
		return;
	}
	staleNativeScheduledId = scheduledId;
	staleNativeTimer = setTimeout(() => {
		staleNativeTimer = null;
		const scheduled = staleNativeScheduledId;
		staleNativeScheduledId = null;
		const st = get();
		if (st.call != null) {
			return;
		}
		if (st.nativeAcceptedCallId !== scheduled) {
			return;
		}
		useCallStore.setState({
			nativeAcceptedCallId: null,
			callId: null
		});
	}, STALE_NATIVE_MS);
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
	dialpadValue: string;

	// Contact info
	contact: CallContact;
}

interface CallStoreActions {
	setCallId: (callId: string | null) => void;
	/** Native accept paths: sets sticky id only; starts/restarts stale-native timer. */
	setNativeAcceptedCallId: (callId: string) => void;
	/** Clears sticky native id (+ transient `callId` when unbound); cancels stale timer. */
	resetNativeCallId: () => void;
	setCall: (call: IClientMediaCall) => void;
	toggleMute: () => void;
	toggleHold: () => void;
	toggleSpeaker: () => void;
	toggleFocus: () => void;
	endCall: () => void;
	/** Clears ring/UI/transient fields; preserves `nativeAcceptedCallId`; restarts stale timer when id preserved. */
	reset: () => void;
	setDialpadValue: (value: string) => void;
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
	dialpadValue: ''
};

export const useCallStore = create<CallStore>((set, get) => ({
	...initialState,

	setCallId: (callId: string | null) => {
		set({ callId });
	},

	setNativeAcceptedCallId: (callId: string) => {
		cancelStaleNativeTimer();
		set({ nativeAcceptedCallId: callId });
		armStaleNativeTimer(get);
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
		set({
			call,
			callId: call.callId,
			callState: call.state,
			isMuted: call.muted,
			isOnHold: call.held,
			remoteMute: call.remoteMute,
			remoteHeld: call.remoteHeld,
			contact: {
				id: call.contact.id,
				displayName: call.contact.displayName,
				username: call.contact.username,
				sipExtension: call.contact.sipExtension
			},
			callStartTime: call.state === 'active' ? Date.now() : null
		});

		try {
			InCallManager.start({ media: 'audio' });
		} catch (error) {
			console.error('[VoIP] InCallManager.start failed:', error);
		}

		// Subscribe to call events
		const handleStateChange = () => {
			const currentCall = get().call;
			if (!currentCall) return;

			const newState = currentCall.state;
			set({ callState: newState });

			// Set start time when call becomes active
			if (newState === 'active' && !get().callStartTime) {
				set({ callStartTime: Date.now() });
			}
		};

		const handleTrackStateChange = () => {
			const currentCall = get().call;
			if (!currentCall) return;

			set({
				isMuted: currentCall.muted,
				isOnHold: currentCall.held,
				remoteMute: currentCall.remoteMute,
				remoteHeld: currentCall.remoteHeld
			});
		};

		const handleEnded = () => {
			get().resetNativeCallId();
			get().reset();
			Navigation.back();
		};

		call.emitter.on('stateChange', handleStateChange);
		call.emitter.on('trackStateChange', handleTrackStateChange);
		call.emitter.on('ended', handleEnded);

		callListenersCleanup = () => {
			call.emitter.off('stateChange', handleStateChange);
			call.emitter.off('trackStateChange', handleTrackStateChange);
			call.emitter.off('ended', handleEnded);
		};
	},

	toggleMute: () => {
		const { call, isMuted } = get();
		if (!call) return;

		call.setMuted(!isMuted);
		set({ isMuted: !isMuted });
	},

	toggleHold: () => {
		const { call, isOnHold } = get();
		if (!call) return;

		call.setHeld(!isOnHold);
		set({ isOnHold: !isOnHold });
	},

	toggleSpeaker: async () => {
		const { call, isSpeakerOn } = get();
		if (!call) return;

		const newSpeakerOn = !isSpeakerOn;

		try {
			await InCallManager.setForceSpeakerphoneOn(newSpeakerOn);
			set({ isSpeakerOn: newSpeakerOn });
		} catch (error) {
			console.error('[VoIP] Failed to toggle speaker:', error);
		}
	},

	toggleFocus: () => {
		const isFocused = get().focused;
		set({ focused: !isFocused });
		if (isFocused) {
			Navigation.back();
		} else {
			Navigation.navigate('CallView');
		}
	},

	setDialpadValue: (value: string) => {
		const { call } = get();
		if (!call) return;

		call.sendDTMF(value);
		const newValue = get().dialpadValue + value;
		set({ dialpadValue: newValue });
	},

	endCall: () => {
		const { call, callId, nativeAcceptedCallId } = get();
		// UUID for the native call UI layer (react-native-callkeep on iOS and Android).
		const callUuid = callId ?? nativeAcceptedCallId;

		if (call) {
			call.hangup();
		}

		if (callUuid) {
			RNCallKeep.endCall(callUuid);
		}

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
			console.error('[VoIP] InCallManager.stop failed:', error);
		}
		set({ ...initialState, nativeAcceptedCallId });
		hideActionSheetRef();
		armStaleNativeTimer(get);
	}
}));

export const useCallState = () => {
	const callState = useCallStore(state => state.callState);
	return callState === 'none' || callState === 'ringing' || callState === 'accepted';
};

export const useCallContact = () => useCallStore(state => state.contact);
export const useDialpadValue = () => useCallStore(state => state.dialpadValue);
