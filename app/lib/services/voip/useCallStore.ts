import { create } from 'zustand';
import type { CallState, CallContact, IClientMediaCall } from '@rocket.chat/media-signaling';

import { voipNative } from './VoipNative';
import Navigation from '../../navigation/appNavigation';
import { hideActionSheetRef } from '../../../containers/ActionSheet';
import { useIsScreenReaderEnabled } from '../../hooks/useIsScreenReaderEnabled';

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
		const remoteContact = remote?.contact;
		set({
			call,
			callId: call.callId,
			callState: call.state,
			isMuted: call.localParticipant.muted,
			isOnHold: call.localParticipant.held,
			remoteMute: remote?.muted ?? false,
			remoteHeld: remote?.held ?? false,
			contact: {
				id: remoteContact?.id,
				displayName: remoteContact?.displayName,
				username: remoteContact?.username,
				sipExtension: remoteContact?.sipExtension
			},
			callStartTime: call.state === 'active' ? Date.now() : null
		});

		voipNative.call.startAudio();

		// Subscribe to call events
		const handleStateChange = () => {
			const currentCall = get().call;
			if (!currentCall) return;

			const newState = currentCall.state;
			set({ callState: newState, controlsVisible: true });

			// Set start time when call becomes active
			if (newState === 'active' && !get().callStartTime) {
				set({ callStartTime: Date.now() });
			}

			// Tell CallKit the call is active so iOS shows it in the system UI (lock screen, Control Center, Dynamic Island)
			if (newState === 'active') {
				const { callId, nativeAcceptedCallId } = get();
				voipNative.call.markActive(callId ?? nativeAcceptedCallId ?? '');
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
				controlsVisible: true
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

	toggleControlsVisible: () => {
		set({ controlsVisible: !get().controlsVisible });
	},

	toggleMute: () => {
		const { call, isMuted } = get();
		if (!call) return;

		call.localParticipant.setMuted(!isMuted);
		set({ isMuted: !isMuted });
	},

	toggleHold: () => {
		const { call, isOnHold } = get();
		if (!call) return;

		call.localParticipant.setHeld(!isOnHold);
		set({ isOnHold: !isOnHold });
	},

	toggleSpeaker: async () => {
		const { call, isSpeakerOn } = get();
		if (!call) return;

		const newSpeakerOn = !isSpeakerOn;
		await voipNative.call.setSpeaker(newSpeakerOn);
		set({ isSpeakerOn: newSpeakerOn });
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
		const { call } = get();
		if (!call) return;

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

		if (call) {
			call.hangup();
		}

		if (callUuid) {
			voipNative.call.end(callUuid);
		}

		get().resetNativeCallId();
		get().reset();
	},

	reset: () => {
		const { nativeAcceptedCallId } = get();
		cleanupCallListeners();
		cancelStaleNativeTimer();
		voipNative.call.stopAudio();
		set({ ...initialState, nativeAcceptedCallId });
		hideActionSheetRef();
		// Old timer was cleared above; start a new one if nativeAcceptedCallId is still set.
		createStaleNativeTimer(get);
	}
}));

export const useCallContact = () => useCallStore(state => state.contact);
export const useDialpadValue = () => useCallStore(state => state.dialpadValue);
export const useControlsVisible = () => {
	const controlsVisible = useCallStore(state => state.controlsVisible);
	const isScreenReaderEnabled = useIsScreenReaderEnabled();
	return controlsVisible || isScreenReaderEnabled;
};
