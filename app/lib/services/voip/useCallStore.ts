import { create } from 'zustand';
import type { CallState, CallContact, IClientMediaCall } from '@rocket.chat/media-signaling';
import RNCallKeep from 'react-native-callkeep';

import Navigation from '../../navigation/appNavigation';

interface CallStoreState {
	// Call reference
	call: IClientMediaCall | null;
	callUUID: string | null;

	// Call state
	callState: CallState;
	isMuted: boolean;
	isOnHold: boolean;
	remoteMute: boolean;
	remoteHeld: boolean;
	isSpeakerOn: boolean;
	callStartTime: number | null;
	focused: boolean;

	// Contact info
	contact: CallContact;
}

interface CallStoreActions {
	setCallUUID: (callUUID: string | null) => void;
	setCall: (call: IClientMediaCall, callUUID: string) => void;
	toggleMute: () => void;
	toggleHold: () => void;
	toggleSpeaker: () => void;
	toggleFocus: () => void;
	endCall: () => void;
	reset: () => void;
}

export type CallStore = CallStoreState & CallStoreActions;

const initialState: CallStoreState = {
	call: null,
	callUUID: null,
	callState: 'none',
	isMuted: false,
	isOnHold: false,
	remoteMute: false,
	remoteHeld: false,
	isSpeakerOn: false,
	callStartTime: null,
	contact: {},
	focused: true
};

export const useCallStore = create<CallStore>((set, get) => ({
	...initialState,

	setCallUUID: (callUUID: string | null) => {
		set({ callUUID });
	},

	setCall: (call: IClientMediaCall, callUUID: string) => {
		// Update state with call info
		set({
			call,
			callUUID,
			callState: call.state,
			isMuted: call.muted,
			isOnHold: call.held,
			remoteMute: call.remoteMute,
			remoteHeld: call.remoteHeld,
			// isSpeakerOn: call.
			contact: {
				id: call.contact.id,
				displayName: call.contact.displayName,
				username: call.contact.username,
				sipExtension: call.contact.sipExtension
			},
			callStartTime: call.state === 'active' ? Date.now() : null
		});

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
			get().reset();
			Navigation.back();
		};

		call.emitter.on('stateChange', handleStateChange);
		call.emitter.on('trackStateChange', handleTrackStateChange);
		call.emitter.on('ended', handleEnded);
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

	toggleSpeaker: () => {
		const { isSpeakerOn } = get();
		// TODO: Implement actual speaker toggle via RNCallKeep or WebRTC audio routing
		set({ isSpeakerOn: !isSpeakerOn });
	},

	toggleFocus: () => {
		const isFocused = get().focused;
		set({ focused: !isFocused });
		if (isFocused) {
			Navigation.back();
		} else {
			Navigation.navigate('CallView', { callUUID: get().callUUID });
		}
	},

	endCall: () => {
		const { call, callState, callUUID } = get();

		if (call) {
			if (callState === 'ringing') {
				call.reject();
			} else {
				call.hangup();
			}
		}

		if (callUUID) {
			RNCallKeep.endCall(callUUID);
		}

		// Navigation.back(); // TODO: It could be collapsed, so going back woudln't make sense
		get().reset();
	},

	reset: () => {
		set(initialState);
	}
}));

// const isConnecting = callState === 'none' || callState === 'ringing' || callState === 'accepted';
// const isConnected = callState === 'active';
export const useCallState = () => {
	const callState = useCallStore(state => state.callState);
	return callState === 'none' || callState === 'ringing' || callState === 'accepted';
};

// // Selector hooks for better performance
// export const useCallState = () => useCallStore(state => state.callState);
export const useCallContact = () => useCallStore(state => state.contact);
// export const useCallControls = () =>
// 	useCallStore(
// 		useShallow(state => ({
// 			isMuted: state.isMuted,
// 			isOnHold: state.isOnHold,
// 			isSpeakerOn: state.isSpeakerOn
// 		}))
// 	);
// export const useCallActions = () =>
// 	useCallStore(state => ({
// 		toggleMute: state.toggleMute,
// 		toggleHold: state.toggleHold,
// 		toggleSpeaker: state.toggleSpeaker,
// 		endCall: state.endCall
// 	}));
