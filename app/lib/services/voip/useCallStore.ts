import { create } from 'zustand';
import type { CallState, CallContact, IClientMediaCall } from '@rocket.chat/media-signaling';
import RNCallKeep from 'react-native-callkeep';
import InCallManager from 'react-native-incall-manager';

import Navigation from '../../navigation/appNavigation';
import { hideActionSheetRef } from '../../../containers/ActionSheet';

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
	dialpadValue: string;

	// Contact info
	contact: CallContact;
}

interface CallStoreActions {
	setCallId: (callId: string | null) => void;
	setCall: (call: IClientMediaCall) => void;
	toggleMute: () => void;
	toggleHold: () => void;
	toggleSpeaker: () => void;
	toggleFocus: () => void;
	endCall: () => void;
	reset: () => void;
	setDialpadValue: (value: string) => void;
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
	dialpadValue: ''
};

export const useCallStore = create<CallStore>((set, get) => ({
	...initialState,

	setCallId: (callId: string | null) => {
		set({ callId });
	},

	setCall: (call: IClientMediaCall) => {
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

	toggleSpeaker: async () => {
		const { callId, isSpeakerOn } = get();
		if (!callId) return;

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
		const { call, callId } = get();

		if (call) {
			call.hangup();
		}

		if (callId) {
			RNCallKeep.endCall(callId);
		}

		// Navigation.back(); // TODO: It could be collapsed, so going back woudln't make sense
		get().reset();
	},

	reset: () => {
		try {
			InCallManager.stop();
		} catch (error) {
			console.error('[VoIP] InCallManager.stop failed:', error);
		}
		set(initialState);
		hideActionSheetRef();
	}
}));

export const useCallState = () => {
	const callState = useCallStore(state => state.callState);
	return callState === 'none' || callState === 'ringing' || callState === 'accepted';
};

export const useCallContact = () => useCallStore(state => state.contact);
export const useDialpadValue = () => useCallStore(state => state.dialpadValue);
