import { create } from 'zustand';
import type { CallState, CallContact, IClientMediaCall } from '@rocket.chat/media-signaling';

import { voipNative } from './VoipNative';
import Navigation from '../../navigation/appNavigation';
import { hideActionSheetRef } from '../../../containers/ActionSheet';
import { useIsScreenReaderEnabled } from '../../hooks/useIsScreenReaderEnabled';
import { callLifecycle } from './CallLifecycle';

let callListenersCleanup: (() => void) | null = null;

function cleanupCallListeners(): void {
	callListenersCleanup?.();
	callListenersCleanup = null;
}

interface CallStoreState {
	// Call reference
	call: IClientMediaCall | null;
	callId: string | null;

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
	setCall: (call: IClientMediaCall) => void;
	toggleMute: () => void;
	toggleHold: () => void;
	toggleSpeaker: () => void;
	toggleControlsVisible: () => void;
	toggleFocus: () => void;
	endCall: () => void;
	/** Clears all call fields. Pre-bind state is owned by CallLifecycle.preBindStatus(). */
	reset: () => void;
	setDialpadValue: (value: string) => void;
	setRoomId: (roomId: string | null) => void;
	setDirection: (direction: 'incoming' | 'outgoing') => void;
}

export type CallStore = CallStoreState & CallStoreActions;

const initialState: CallStoreState = {
	call: null,
	callId: null,
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

	setCall: (call: IClientMediaCall) => {
		cleanupCallListeners();
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
				const { callId } = get();
				voipNative.call.markActive(callId ?? '');
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
			// Navigation.back() removed — CallNavRouter handles navigation after callEnded emits.
			callLifecycle.end('remote');
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
		// Delegate to CallLifecycle for idempotent, ordered teardown.
		callLifecycle.end('local');
	},

	reset: () => {
		cleanupCallListeners();
		// NOTE: stopAudio is intentionally NOT called here.
		// CallLifecycle.end() calls voipNative.call.stopAudio() as step 6 (after reset),
		// ensuring subscribers see consistent JS state when callEnded emits.
		// If reset() is called outside of CallLifecycle (e.g., on session teardown),
		// stopAudio is a safe no-op if audio was not started.
		set(initialState);
		hideActionSheetRef();
	}
}));

export const useCallContact = () => useCallStore(state => state.contact);
export const useDialpadValue = () => useCallStore(state => state.dialpadValue);
export const useControlsVisible = () => {
	const controlsVisible = useCallStore(state => state.controlsVisible);
	const isScreenReaderEnabled = useIsScreenReaderEnabled();
	return controlsVisible || isScreenReaderEnabled;
};
