import { getCallConnectionState } from '../getCallConnectionState';

describe('getCallConnectionState', () => {
	it.each([
		['connected', 'connected'],
		['connecting', 'connecting'],
		['reconnecting', 'reconnecting'],
		['signalReconnecting', 'reconnecting'],
		['disconnected', 'disconnected']
	])('maps LiveKit %s to %s', (liveKitState, expected) => {
		expect(getCallConnectionState(liveKitState)).toBe(expected);
	});

	it('treats an unknown state as disconnected rather than connected', () => {
		expect(getCallConnectionState('resuming')).toBe('disconnected');
	});
});
