import type { CallState, IClientMediaCall } from '@rocket.chat/media-signaling';
import { randomUuid } from '@rocket.chat/mobile-crypto';

// import Navigation from '../../navigation/appNavigation';
import { useCallStore } from './useCallStore';

interface SimulateCallOptions {
	callState?: CallState;
	contact?: {
		displayName?: string;
		username?: string;
		sipExtension?: string;
	};
	isMuted?: boolean;
	isOnHold?: boolean;
}

const defaultContact = {
	displayName: 'Bob Burnquist',
	username: 'bob.burnquist',
	sipExtension: '2244'
};

/**
 * Simulates a call for UI development purposes.
 * Creates a mock IClientMediaCall object, sets it in the call store, and navigates to CallView.
 */
export const simulateCall = async (options: SimulateCallOptions = {}): Promise<void> => {
	const { callState = 'active', contact = defaultContact, isMuted = false, isOnHold = false } = options;

	// Create a simple event emitter for the mock call
	const listeners: Record<string, Set<(...args: unknown[]) => void>> = {};

	const emitter = {
		on: (event: string, callback: (...args: unknown[]) => void) => {
			if (!listeners[event]) {
				listeners[event] = new Set();
			}
			listeners[event].add(callback);
		},
		off: (event: string, callback: (...args: unknown[]) => void) => {
			listeners[event]?.delete(callback);
		},
		emit: (event: string, ...args: unknown[]) => {
			listeners[event]?.forEach(cb => cb(...args));
		}
	};

	// Track mutable state for the mock
	let currentMuted = isMuted;
	let currentHeld = isOnHold;
	let currentState: CallState = callState;

	const mockCall = {
		callId: `mock-call-${Date.now()}`,
		state: currentState,
		get muted() {
			return currentMuted;
		},
		get held() {
			return currentHeld;
		},
		contact: {
			displayName: contact.displayName,
			username: contact.username,
			sipExtension: contact.sipExtension
		},
		setMuted: (muted: boolean) => {
			currentMuted = muted;
			emitter.emit('trackStateChange');
		},
		setHeld: (held: boolean) => {
			currentHeld = held;
			emitter.emit('trackStateChange');
		},
		hangup: () => {
			currentState = 'ended' as CallState;
			emitter.emit('ended');
		},
		reject: () => {
			currentState = 'ended' as CallState;
			emitter.emit('ended');
		},
		sendDTMF: (_digits: string) => {
			// No-op for simulation
		},
		emitter
	} as unknown as IClientMediaCall;

	// Generate a unique callUUID
	const callUUID = (await randomUuid()).toLowerCase();

	// Set up the call store
	useCallStore.getState().setCall(mockCall, callUUID);

	// If simulating a specific initial state, update the store
	if (isMuted || isOnHold) {
		useCallStore.setState({
			isMuted,
			isOnHold
		});
	}

	// Navigate to CallView
	// Navigation.navigate('CallView', { callUUID });
};
