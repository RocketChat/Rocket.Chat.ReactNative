import type { CallState, IClientMediaCall } from '@rocket.chat/media-signaling';

import Navigation from '../../navigation/appNavigation';
import { useCallStore } from './useCallStore';

export interface MockCallOverrides {
	callState?: CallState;
	isMuted?: boolean;
	isOnHold?: boolean;
	isSpeakerOn?: boolean;
	callStartTime?: number | null;
	roomId?: string | null;
	role?: 'caller' | 'callee';
	contact?: {
		id?: string;
		displayName?: string;
		username?: string;
		sipExtension?: string;
	};
}

const DEFAULT_CONTACT = {
	id: 'mock-contact-id',
	displayName: 'Bob Burnquist',
	username: 'bob.burnquist',
	sipExtension: ''
};

/**
 * Build a fake `IClientMediaCall` good enough to render `CallView` without a real SIP/WebRTC stack.
 * No-op `setMuted/setHeld/hangup/sendDTMF` and a no-op event emitter so store subscriptions are safe.
 */
export function createMockCall(overrides: MockCallOverrides = {}): IClientMediaCall {
	const contact = { ...DEFAULT_CONTACT, ...overrides.contact };
	const callState: CallState = overrides.callState ?? 'active';

	const mock = {
		callId: 'mock-call-id',
		state: callState,
		localParticipant: {
			local: true as const,
			participantId: 'mock-participant-id',
			actorType: 'user' as const,
			actorId: 'mock-actor-id',
			role: overrides.role ?? 'callee' as const,
			muted: overrides.isMuted ?? false,
			held: overrides.isOnHold ?? false,
			contact,
			getMediaStream: () => null,
			setMuted: () => {},
			setHeld: () => {}
		},
		remoteParticipants: [],
		participants: [],
		emitter: {
			on: () => {},
			off: () => {}
		},
		accept: () => {},
		hangup: () => {},
		reject: () => {},
		sendDTMF: () => {}
	};

	return mock as unknown as IClientMediaCall;
}

/**
 * Seed `useCallStore` with a mock call so `CallView` renders without going through `setCall`
 * (which subscribes real listeners and starts `InCallManager`).
 */
export function seedMockCall(overrides: MockCallOverrides = {}): void {
	const mockCall = createMockCall(overrides);
	const callState: CallState = overrides.callState ?? 'active';

	useCallStore.setState({
		call: mockCall,
		callId: mockCall.callId,
		callState,
		isMuted: overrides.isMuted ?? false,
		isOnHold: overrides.isOnHold ?? false,
		isSpeakerOn: overrides.isSpeakerOn ?? false,
		callStartTime: overrides.callStartTime ?? (callState === 'active' ? Date.now() : null),
		contact: { ...DEFAULT_CONTACT, ...overrides.contact },
		roomId: overrides.roomId ?? 'mock-room-id',
		focused: true,
		controlsVisible: true
	});
}

/**
 * Dev helper: seed a mock call and navigate to `CallView`. Use from a debug button to exercise
 * the call UI on the iOS simulator without a real call.
 */
export function launchMockCallView(overrides: MockCallOverrides = {}): void {
	seedMockCall(overrides);
	Navigation.navigate('CallView');
}
